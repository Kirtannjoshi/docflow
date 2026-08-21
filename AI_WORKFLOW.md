# AI Workflow

This document records the AI-assisted development process, highlighting the division of labor between the AI assistant and the engineer.

---

## AI Tools Used

- **Antigravity (Gemini 3.5 Flash)**: Used for scaffolding components, database setup, and drafting documentation.

---

## Where AI Helped

1. **Scaffolding Components**: Provided Vite config integrations, Tailwind v4 setups, and TipTap react hook structures.
2. **API implementation**: Crafted the Express server with specific access controls.
3. **Database Adapter**: Wrote SQL schema setups and helper methods.
4. **Integration Testing**: Designed the automated integration test suite.
5. **Documentation**: Assisted in formatting and styling this documentation suite.

---

## Human Decisions

1. **SQLite Fallback Strategy**: Decided to build a dynamic SQL adapter that runs 100% locally on SQLite if no external Postgres URL is defined. This allows reviewers to run the project instantly.
2. **State-Based Client Router**: Chose to implement navigation via custom state hooks rather than introducing `react-router-dom`. This prevents route configuration and static hosting issues.
3. **Passwordless Demo Login**: Chose to run simulated demo logins. Seeded users can be chosen from a quick-select menu.

---

## AI Output Changed or Rejected

- **Vite React Icons**: Originally, the AI suggested installing complex icon packs. The engineer requested `lucide-react` for clean aesthetics.
- **SQL Parameter Mapping**: The AI suggested using separate Knex setup. The engineer requested a simple string regex-replace wrapper (`sql.replace(/\$\d+/g, '?')`) in `db.js` to reuse standard `$1, $2` SQL parameterized queries across SQLite and PostgreSQL, reducing dependencies.

---

## Verification

1. **Automated Tests**: Ran `node server/test.js` validating authentication, CRUD, and access privileges.
2. **Persistence Validation**: Performed manual page refreshes on local dev (`http://localhost:5173`) checking TipTap state retention.
3. **Sharing Verification**: Authenticated as `Kirtan`, shared a document with `alex@demo.com`, switched sessions, and verified readability on Alex's dashboard.
4. **File Import Verification**: Successfully uploaded a `.md` format document and verified it opens inside the editor immediately.
