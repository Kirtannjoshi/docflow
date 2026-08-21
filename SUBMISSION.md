# Submission Details

This file lists the deliverables for the DocFlow hiring assessment.

---

## Deliverables

### Source Code
- **Client**: React / Vite / Tailwind v4 / TipTap (located in `/client`)
- **Server**: Express / Node / SQLite & PG (located in `/server`)

### Documentation Artifacts
- [README.md](file:///c:/Users/KIRTAN%20JOSHI/project/test%20project%201/README.md)
- [ARCHITECTURE.md](file:///c:/Users/KIRTAN%20JOSHI/project/test%20project%201/ARCHITECTURE.md)
- [AI_WORKFLOW.md](file:///c:/Users/KIRTAN%20JOSHI/project/test%20project%201/AI_WORKFLOW.md)
- [SUBMISSION.md](file:///c:/Users/KIRTAN%20JOSHI/project/test%20project%201/SUBMISSION.md) (This file)

### Live Product URL
*To be filled upon final deployment, for example:*
- Frontend: `https://docflow-editor.vercel.app`
- Backend: `https://docflow-api.onrender.com`

### Demo Credentials
- **Account 1**: `kirtan@demo.com` (Selectable on the Login screen)
- **Account 2**: `alex@demo.com` (Selectable on the Login screen)
- *Custom account emails are also supported.*

### Walkthrough Video URL
*To be added by candidate (3-5 minute demo)*

---

## Working Features

- **Document CRUD**: Creating, editing, renaming, and deleting documents.
- **Autosave Engine**: Keeps changes persisted dynamically in the background with a 1s debounce.
- **TipTap Formatting**: Support for Bold, Italic, Underline, Headings (H1/H2), Bullet Lists, and Numbered Lists.
- **Demo Switcher**: Simulated session switching to demonstrate real-time data ownership.
- **Document Sharing**: Access permission controls (Viewer vs Editor permissions) with strict server-side checks.
- **File Ingestion**: Uploading and parsing `.txt` and `.md` documents, importing content directly.
- **Persistence Layer**: Fully compatible with SQLite (local development) and PostgreSQL (production).
- **Automated Tests**: Integration tests covering databases, access rights, and permission models.

---

## Incomplete Features

- Real-time simultaneous concurrent multi-user editing (typing cursor presence) was intentionally deferred to guarantee a robust persistence model.

---

## Next 2–4 Hours Action Items

1. **Y.js Integration**: Integrate Y.js and WebSockets to sync keystrokes and display user cursor presence.
2. **Offline Draft Queueing**: Register Service Workers to cache edits locally during outages, sync-pushing drafts upon connection restore.
3. **Version History**: Add a document revision log capturing previous editor snapshots.
