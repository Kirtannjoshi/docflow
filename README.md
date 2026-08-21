# DocFlow

A lightweight, collaborative, and AI-native document editor inspired by Google Docs, built as a full-stack web application.

---

## Overview

DocFlow is designed for high-performance productivity. It provides rich-text editing, dynamic auto-saving, file imports, and real-time sharing with access controls.

- **Local Development**: Completely self-contained SQLite configuration (zero external account setup).
- **Production**: Seamlessly swaps to Supabase PostgreSQL catalog via environment variables.

---

## Features

- **Document Management**: Create, rename, edit, and delete documents.
- **Rich-Text Editor**: Built with TipTap (Bold, Italic, Underline, Headings, Bullet Lists, Numbered Lists).
- **Auto-Saving**: Debounced status indicator (Saving..., Saved, Error).
- **Document Sharing**: Access control list by email with distinct Viewer vs Editor permissions.
- **File Import**: Quick parsing and import for `.txt` and `.md` files.
- **Demo Switcher**: Easy login flow simulating multiple authenticated accounts.

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Lucide Icons, TipTap Editor
- **Backend**: Node.js, Express.js
- **Database**: SQLite (Local Dev) / PostgreSQL (Production, e.g. Supabase)
- **Testing**: Built-in integration assertion tests

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                      React Client                      │
│   (Vite + Tailwind v4 + TipTap Rich-Text Workspace)    │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON/HTTP API)
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Express Server                     │
│               (Access Control + Router)                │
└───────────────────────────┬────────────────────────────┘
                            │ (Unified Client db.js)
                            ▼
           ┌─────────────────┴─────────────────┐
           ▼                                   ▼
   SQLite (Local Dev)                 PostgreSQL (Prod)
      (docflow.db)                      (DATABASE_URL)
```

---

## Local Setup

### 1. Clone & Install Dependencies
Run the following commands in the project directory:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Run the Application
In separate terminal windows, start both servers:

```bash
# In server/
npm start

# In client/
npm run dev
```

The frontend will run at `http://localhost:5173/` and backend at `http://localhost:5000/`.

---

## Environment Variables

Create a `.env` file in the `server` folder (optional for local SQLite, required for PostgreSQL):

```env
PORT=5000
DATABASE_URL=your-supabase-postgresql-connection-string
```

---

## Database Setup

- **Local (SQLite)**: Automatically initialized upon server startup. Creates tables and seeds demo accounts in `./server/docflow.db` automatically.
- **Production (PostgreSQL)**: Connected via `DATABASE_URL`. Tables will be provisioned automatically on the first connection.

---

## Demo Accounts

No registration is required. You can choose one of these seeded accounts on the Login screen:
- **Kirtan**: `kirtan@demo.com`
- **Alex**: `alex@demo.com`

---

## Supported File Types

- Plain Text: `.txt`
- Markdown: `.md`

---

## Running Tests

To run the automated integration test suite:

```bash
cd server
npm test
```

---

## Deployment

### Frontend (Vercel)
1. Link your repo to Vercel.
2. Build command: `vite build` (inside `client` directory).
3. Output directory: `dist`.

### Backend (Render)
1. Deploy a Web Service from the `server` directory.
2. Set Environment Variables: `DATABASE_URL` (Supabase Postgres URI).

---

## Known Limitations

- Real-time cursor presence (typing sync) is deferred to ensure optimal state autosaving.
- Offline support is not enabled.

---

## Future Improvements

1. Real-time concurrent edits with Y.js / WebSockets.
2. Folder structures for document organization.
3. Offline draft queuing.
