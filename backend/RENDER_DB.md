# Provisioning a Postgres database on Render and initializing it for VoiceIQ

This guide shows how to provision a managed Postgres on Render and initialize it with the application schema.

Steps

1. Provision a Postgres instance on Render
   - In the Render dashboard, go to New -> Database -> Postgres
   - Choose a name (e.g. `voiceiq-db`) and a plan
   - Create the database and wait until it's healthy

2. Attach the database to your service (optional but recommended)
   - In Render, go to your service (the backend service)
   - Under "Environment" -> "Databases", attach the newly created Postgres
   - Render will set the `DATABASE_URL` environment variable for your service automatically

3. Add `psycopg2-binary` to your `backend/requirements.txt` (already added in this repo)

4. Initialize the database schema

Option A — Run locally (developer machine)

- If you have network access to the Render Postgres (check Render firewall settings), set `DATABASE_URL` locally and run the init script:

```powershell
# in repo root
$env:DATABASE_URL = "postgres://user:pass@host:port/dbname"
python backend/init_render_db.py
```

Option B — Run from Render shell

- Use Render's shell for the database or the service instance to run the init script directly in the Render environment (no credentials required):
  - In the Render dashboard, open your service -> Shell
  - Run: `python backend/init_render_db.py`

Option C — GitHub Actions (automated)

- Add a job to run the `backend/init_render_db.py` script after deployment. Ensure the job runs with the `DATABASE_URL` environment variable available (Render will provide it when attached) and `python -m pip install -r backend/requirements.txt` is run first to install `psycopg2-binary`.

5. Verify

- Connect to the Postgres database with any client (psql, DBeaver) using the connection string in Render and confirm the tables exist:

```sql
\dt
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

Notes

- The app will continue to use SQLite when `DATABASE_URL` is not set. To fully use Postgres in production, ensure the backend process has the `DATABASE_URL` env var pointing to the Render Postgres instance.
- Some app SQL is written for SQLite (e.g., `PRAGMA` statements). Those will be ignored when using Postgres. Most of the schema and operations in `backend/init_render_db.py` are compatible with Postgres and use JSONB for structured columns.

Troubleshooting

- If the app still hits a `voiceiq.db` file after attaching the Postgres DB, search code for hardcoded `database.db` or file-based sqlite3.connect calls and replace them to use the `DATABASE_URL` logic.
