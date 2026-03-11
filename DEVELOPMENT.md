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
- **Stop background services**:
  ```bash
  pnpm run dev:docker:down
  ```

---

## 🛠️ Maintenance Commands

- **Reset Everything**: Stop all services and delete local database data to start fresh:
  ```bash
  pnpm run dev:docker:reset
  ```
- **Database Migrations**: Manualy trigger migrations if you change schema:
  ```bash
  pnpm run db:migrate
  ```

> \[!IMPORTANT]
> Ensure your root `.env` file is configured with your AI provider API keys (like `OPENAI_API_KEY`) for full functionality.
