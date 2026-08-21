import express from 'express';
import cors from 'cors';
import { dbService } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware: requires x-user-id header
async function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please set x-user-id header.' });
  }
  
  try {
    const user = await dbService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

// 1. POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let user = await dbService.getUserByEmail(email);
    if (!user) {
      const displayName = name || email.split('@')[0];
      user = await dbService.createUser(displayName, email);
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// 2. GET /api/documents
app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const docs = await dbService.getOwnedDocuments(req.user.id);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// 3. POST /api/documents
app.post('/api/documents', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Document title cannot be empty' });
  }

  try {
    const doc = await dbService.createDocument(title, content, req.user.id);
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// 4. GET /api/documents/:id
app.get('/api/documents/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const access = await dbService.verifyAccess(id, req.user.id);
    if (!access) {
      return res.status(403).json({ error: 'You do not have access to this document.' });
    }

    const doc = await dbService.getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Include permission role so the frontend can restrict edits
    doc.permission = access.permission;
    doc.role = access.role;

    // If owner, fetch who this is shared with
    if (access.role === 'owner') {
      doc.shares = await dbService.getSharesForDocument(id);
    }

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load document' });
  }
});

// 5. PATCH /api/documents/:id
app.patch('/api/documents/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Document title cannot be empty' });
  }

  try {
    const access = await dbService.verifyAccess(id, req.user.id);
    if (!access || access.permission !== 'edit') {
      return res.status(403).json({ error: 'You do not have edit permission for this document.' });
    }

    const doc = await dbService.getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedDoc = await dbService.updateDocument(
      id,
      title !== undefined ? title : doc.title,
      content !== undefined ? content : doc.content
    );

    res.json(updatedDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// 6. DELETE /api/documents/:id
app.delete('/api/documents/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const access = await dbService.verifyAccess(id, req.user.id);
    if (!access || access.role !== 'owner') {
      return res.status(403).json({ error: 'Only the document owner can delete this document.' });
    }

    await dbService.deleteDocument(id);
    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// 7. POST /api/documents/:id/share
app.post('/api/documents/:id/share', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { email, permission } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }
  if (!permission || !['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: "Permission must be either 'view' or 'edit'" });
  }

  try {
    const access = await dbService.verifyAccess(id, req.user.id);
    if (!access || access.role !== 'owner') {
      return res.status(403).json({ error: 'Only the document owner can share this document.' });
    }

    const sharedUser = await dbService.shareDocument(id, email.trim(), permission);
    res.json({ success: true, message: `Document shared with ${sharedUser.name} (${email})` });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to share document' });
  }
});

// 8. GET /api/shared-documents
app.get('/api/shared-documents', requireAuth, async (req, res) => {
  try {
    const docs = await dbService.getSharedDocuments(req.user.id);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve shared documents' });
  }
});

// 9. POST /api/documents/import
app.post('/api/documents/import', requireAuth, async (req, res) => {
  const { title, content } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Import title is required' });
  }

  try {
    const doc = await dbService.createDocument(title, content, req.user.id);
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import document' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
dbService.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DocFlow API server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
