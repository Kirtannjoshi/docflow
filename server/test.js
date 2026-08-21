import assert from 'assert';
import express from 'express';
import cors from 'cors';
import { dbService } from './db.js';
import { v4 as uuidv4 } from 'uuid';

// Setup temporary SQLite path for tests to avoid polluting dev DB
process.env.SQLITE_DB_PATH = './test-docflow.db';

const app = express();
app.use(cors());
app.use(express.json());

// Re-declare endpoints in isolation or import app. Since index.js starts the server itself on port 5000 immediately,
// let's define a test helper to start the API or run the tests directly against database logic and endpoints.
// Actually, since index.js runs dbService.initDb() and app.listen(), importing it would start it on 5000.
// Let's create the endpoints in server/test.js using the same middleware and routes, or we can run the test on the running 5000 port!
// Running against http://localhost:5000 is extremely reliable since we already launched the dev server,
// OR we can test the dbService functions directly.
// Testing the dbService and API endpoints directly is extremely clean.
// Let's write the test to verify dbService logic, which contains all our access control rules, sharing rules, and CRUD operations!
// This is robust, self-contained, and doesn't rely on port bindings.

async function runTests() {
  console.log('🔄 Running automated integration tests...');

  try {
    // 1. Initialize Database
    await dbService.initDb();
    console.log('✅ DB initialized.');

    // Clean up test data if left over
    // We can do it by creating unique test users
    const kirtanEmail = `kirtan-test-${Date.now()}@demo.com`;
    const alexEmail = `alex-test-${Date.now()}@demo.com`;

    // 2. Create Users
    const userKirtan = await dbService.createUser('Kirtan Test', kirtanEmail);
    const userAlex = await dbService.createUser('Alex Test', alexEmail);
    
    assert.ok(userKirtan.id, 'User Kirtan should have an ID');
    assert.ok(userAlex.id, 'User Alex should have an ID');
    console.log('✅ Users created successfully.');

    // 3. Create Document as Kirtan
    const title = 'Secret Strategy Doc';
    const content = '<p>Drafting version 1...</p>';
    const doc = await dbService.createDocument(title, content, userKirtan.id);
    
    assert.strictEqual(doc.title, title, 'Document title matches');
    assert.strictEqual(doc.owner_id, userKirtan.id, 'Kirtan owns the document');
    console.log('✅ Document created successfully.');

    // 4. Verify Access Controls (Alex cannot access Kirtan's private doc)
    const alexAccessInitial = await dbService.verifyAccess(doc.id, userAlex.id);
    assert.strictEqual(alexAccessInitial, null, 'Alex should NOT have access to Kirtan\'s document');
    console.log('✅ Initial security checks passed (Unauthorized user blocked).');

    // 5. Update Document as Owner (Kirtan)
    const updatedTitle = 'Shared Strategy Doc';
    const updatedContent = '<h1>Version 2</h1>';
    const updatedDoc = await dbService.updateDocument(doc.id, updatedTitle, updatedContent);
    
    assert.strictEqual(updatedDoc.title, updatedTitle, 'Title updated');
    assert.strictEqual(updatedDoc.content, updatedContent, 'Content updated');
    console.log('✅ Document update by owner succeeded.');

    // 6. Share Document with Alex as "view" only
    await dbService.shareDocument(doc.id, alexEmail, 'view');
    console.log('✅ Document shared with Alex as viewer.');

    // 7. Verify Access Controls (Alex can now access)
    const alexAccessShared = await dbService.verifyAccess(doc.id, userAlex.id);
    assert.ok(alexAccessShared, 'Alex should now have access');
    assert.strictEqual(alexAccessShared.role, 'shared', 'Alex is a shared user');
    assert.strictEqual(alexAccessShared.permission, 'view', 'Alex has view permission');
    console.log('✅ Sharing security checks passed (Alex granted read-only access).');

    // 8. Delete Document
    await dbService.deleteDocument(doc.id);
    const docDeleted = await dbService.getDocument(doc.id);
    assert.strictEqual(docDeleted, null, 'Document should be deleted from DB');
    console.log('✅ Document deletion succeeded.');

    console.log('\n⭐ ALL TESTS PASSED SUCCESSFULLY! ⭐');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILURE:', err);
    process.exit(1);
  }
}

runTests();
