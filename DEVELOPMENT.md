# LobeChat Self-Host Development Guide

This guide provides the necessary commands to run and manage your local self-hosted development environment.

## 🚀 How to Run

To start the full development stack, run these commands in separate terminal windows (or sequentially):

1. **Start Background Services** (Postgres, Redis, RustFS, SearXNG):

   ```bash
   pnpm run dev:docker
   ```

2. **Start LobeChat App**:
   ```bash
   pnpm run dev
   ```

The application will be available at **<http://localhost:3010>**.

---

## 🛑 How to Stop

- **Stop the app**: Press `Ctrl + C` in the terminal where `pnpm run dev` is running.
- **Pause background services (Keep Data)**:
  ```bash
  pnpm run dev:docker:stop
  ```
- **Remove background services (Clean Slate)**:
  ```bash
  pnpm run dev:docker:down
  ```

---

## 🛠️ Maintenance & Troubleshooting

- **Relation "xxx" does not exist**: If you see this error (e.g., `relation "agent_bot_providers" does not exist`), it means the database is fresh but migrations haven't run. Manually run:
  ```bash
  pnpm run db:migrate
  ```
- **Reset Everything**: Stop all services and delete local database data to start fresh:
  ```bash
  pnpm run dev:docker:reset
  ```
- **DB Persistence**: Use `stop` instead of `down` for Docker services to keep your chat history and settings across restarts.

> \[!IMPORTANT]
> Ensure your root `.env` file is configured with your AI provider API keys (like `OPENAI_API_KEY`) for full functionality.

---

## 🗄️ Database Migrations

### Adding a new migration

1. **Update the schema** in `packages/database/src/schemas/`.

2. **Generate the migration**:
   ```bash
   pnpm db:generate
   ```
   This creates the `.sql` file, snapshot, and updates `_journal.json` in `packages/database/migrations/`.

3. **Review the generated SQL** — for special cases (e.g. pgvector column type changes), the generated SQL may not work. Open the `.sql` file and replace with correct SQL if needed.

4. **Apply locally**:
   ```bash
   pnpm db:migrate
   ```

5. **Production** — migrations run automatically on deploy via the Docker entrypoint.

### Re-running a migration

If a migration ran but failed silently (e.g. pgvector `ALTER COLUMN TYPE`), delete its record and re-run:

```sql
-- Find the hash from the migration file name or:
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;

-- Delete the record to allow re-run
DELETE FROM drizzle.__drizzle_migrations WHERE hash = '<hash>';
```

Then run `pnpm db:migrate` again.

### Verifying a migration

```sql
-- Check latest migrations
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5;

-- Check a specific column type
SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
FROM pg_attribute a
WHERE a.attrelid = '<table_name>'::regclass
  AND a.attname = '<column_name>'
  AND NOT a.attisdropped;

-- Check an index exists
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = '<table_name>';
```
