import sqlite3 from 'sqlite3';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = !!process.env.DATABASE_URL;
let db;

// Helper to run query and return all rows
async function queryAll(sql, params = []) {
  if (isProduction) {
    const res = await db.query(sql, params);
    return res.rows;
  } else {
    // sqlite3 params are passed directly, but placeholders must be replaced from $1, $2 to ?, ?, etc.
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      db.all(sqliteSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

// Helper to run query and return first row
async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

// Helper to run insert/update/delete
async function runQuery(sql, params = []) {
  if (isProduction) {
    await db.query(sql, params);
  } else {
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      db.run(sqliteSql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

// Initialize database connection
async function initDb() {
  if (isProduction) {
    console.log('Connecting to PostgreSQL database...');
    db = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log('Connecting to SQLite local database...');
    db = new sqlite3.Database(process.env.SQLITE_DB_PATH || './docflow.db');
  }

  // Create tables if they do not exist
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createDocsTable = `
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createSharesTable = `
    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT DEFAULT 'view',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (document_id, user_id)
    );
  `;

  if (isProduction) {
    // PostgreSQL uses double quotes or lowercase, text types, standard constraints
    const client = await db.connect();
    try {
      await client.query(createUsersTable.replace(/TEXT/g, 'VARCHAR(255)'));
      await client.query(createDocsTable.replace(/TEXT/g, 'VARCHAR(255)').replace('content VARCHAR(255)', 'content TEXT'));
      await client.query(createSharesTable.replace(/TEXT/g, 'VARCHAR(255)'));
    } finally {
      client.release();
    }
  } else {
    // SQLite runs sequential queries
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(createUsersTable, (err) => { if (err) reject(err); });
        db.run(createDocsTable, (err) => { if (err) reject(err); });
        db.run(createSharesTable, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // Seed default demo users
  await seedDemoUsers();
}

async function seedDemoUsers() {
  const users = [
    { id: 'u1', name: 'Kirtan', email: 'kirtan@demo.com' },
    { id: 'u2', name: 'Alex', email: 'alex@demo.com' }
  ];

  for (const user of users) {
    const existing = await queryOne('SELECT * FROM users WHERE email = $1', [user.email]);
    if (!existing) {
      await runQuery(
        'INSERT INTO users (id, name, email) VALUES ($1, $2, $3)',
        [user.id, user.name, user.email]
      );
    }
  }
}

// DB Functions
export const dbService = {
  initDb,
  
  // User operations
  async getUserByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = $1', [email]);
  },
  
  async createUser(name, email) {
    const id = uuidv4();
    await runQuery('INSERT INTO users (id, name, email) VALUES ($1, $2, $3)', [id, name, email]);
    return { id, name, email };
  },

  async getUserById(id) {
    return queryOne('SELECT * FROM users WHERE id = $1', [id]);
  },

  // Document operations
  async createDocument(title, content, ownerId) {
    const id = uuidv4();
    await runQuery(
      'INSERT INTO documents (id, title, content, owner_id) VALUES ($1, $2, $3, $4)',
      [id, title, content || '', ownerId]
    );
    return this.getDocument(id);
  },

  async getDocument(id) {
    return queryOne('SELECT * FROM documents WHERE id = $1', [id]);
  },

  async updateDocument(id, title, content) {
    const now = new Date().toISOString();
    await runQuery(
      'UPDATE documents SET title = $1, content = $2, updated_at = $3 WHERE id = $4',
      [title, content, now, id]
    );
    return this.getDocument(id);
  },

  async deleteDocument(id) {
    await runQuery('DELETE FROM documents WHERE id = $1', [id]);
    return true;
  },

  async getOwnedDocuments(ownerId) {
    return queryAll('SELECT * FROM documents WHERE owner_id = $1 ORDER BY updated_at DESC', [ownerId]);
  },

  // Shared documents operations
  async getSharedDocuments(userId) {
    const sql = `
      SELECT d.*, u.name as owner_name, u.email as owner_email, ds.permission
      FROM documents d
      JOIN document_shares ds ON d.id = ds.document_id
      JOIN users u ON d.owner_id = u.id
      WHERE ds.user_id = $1
      ORDER BY d.updated_at DESC
    `;
    return queryAll(sql, [userId]);
  },

  async shareDocument(documentId, targetUserEmail, permission) {
    const targetUser = await this.getUserByEmail(targetUserEmail);
    if (!targetUser) {
      throw new Error('User not found');
    }
    
    // Check if sharing with owner
    const doc = await this.getDocument(documentId);
    if (doc.owner_id === targetUser.id) {
      throw new Error('Cannot share document with the owner');
    }

    const shareId = uuidv4();
    // Use REPLACE/UPSERT logic
    if (isProduction) {
      await runQuery(
        `INSERT INTO document_shares (id, document_id, user_id, permission) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (document_id, user_id) 
         DO UPDATE SET permission = EXCLUDED.permission`,
        [shareId, documentId, targetUser.id, permission]
      );
    } else {
      // For SQLite: INSERT OR REPLACE
      await runQuery(
        `INSERT OR REPLACE INTO document_shares (id, document_id, user_id, permission) 
         VALUES ($1, $2, $3, $4)`,
        [shareId, documentId, targetUser.id, permission]
      );
    }
    return targetUser;
  },

  async getSharesForDocument(documentId) {
    const sql = `
      SELECT ds.id, ds.permission, u.id as user_id, u.name, u.email
      FROM document_shares ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.document_id = $1
    `;
    return queryAll(sql, [documentId]);
  },

  // Authorization helper
  async verifyAccess(documentId, userId) {
    const doc = await this.getDocument(documentId);
    if (!doc) return null; // Document not found

    if (doc.owner_id === userId) {
      return { role: 'owner', permission: 'edit' };
    }

    const share = await queryOne(
      'SELECT permission FROM document_shares WHERE document_id = $1 AND user_id = $2',
      [documentId, userId]
    );

    if (share) {
      return { role: 'shared', permission: share.permission };
    }

    return null; // No access
  }
};
