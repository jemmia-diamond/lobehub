# System Architecture Overview

This document provides a high-level overview of the technology stack, directory structure, sequence diagrams, and system initialization routines of Brainy.

---

## 1. Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript.
- **UI Components**: Ant Design, `@lobehub/ui`, `antd-style` for CSS-in-JS styling.
- **State Management**: Zustand stores for client-side state, SWR for caching and data revalidation.
- **Database**: PostgreSQL (production), pgvector for semantic storage, PGLite (client-side/fallback), and Drizzle ORM.
- **Testing**: Vitest for unit and integration testing, Playwright + Cucumber for E2E testing.
- **Package Manager**: pnpm (monorepo structure).

---

## 2. Directory Structure

```plaintext
lobehub/
├── apps/desktop/           # Electron desktop app
├── packages/               # Shared internal packages (@lobechat/*)
│   ├── database/           # DB schemas, migration SQL files, models, and repositories
│   ├── agent-runtime/      # Core execution runtime for agents
│   └── ...
├── src/
│   ├── app/                # Next.js App Router (entry points and routes)
│   ├── spa/                # Single-page application configurations and routing setup
│   ├── routes/             # SPA page layouts and UI frame definitions (no business logic)
│   ├── features/           # Domain-specific components, hooks, and views
│   ├── store/              # Global Zustand state stores
│   ├── services/           # Client-side API services
│   ├── server/             # Server-side services, helper modules, and TRPC routers
│   └── ...
├── packages/knowledge-seed/jemmia-diamond/  # Static knowledge files for bootstrapping (RAG)
├── .agents/skills/         # Automated developer skills for AI agents
└── e2e/                    # E2E test suites
```

---

## 3. Sequence Diagrams

Two sequence diagrams document the core flows:

- **Authentication Flow**: Defined at `.agents/diagrams/auth-flow.md` — covers traditional email/password credentials and Lark SSO OAuth integration.
- **Core Chat Flow**: Defined at `.agents/diagrams/core-chat-flow.md` — covers message submission → intelligent model routing → RAG/Knowledge Base search → streaming response compilation.

---

## 4. System Initialization & Instrumentation

On server startup, `register()` in `src/instrumentation.ts` configures and runs essential backend services:

- **Sentry Logging**: Dynamically imports `sentry.server.config` (for standard NodeJS runtime) or `sentry.edge.config` (for Edge runtime) when the `SENTRY_DSN` environment variable is defined.
- **Local File Logger**: In non-production environments, setting `DEBUG_LOG_FILE=1` loads `src/libs/debug-file-logger` to hijack `process.stdout.write` and `process.stderr.write`, redirecting all server console outputs to `logs/YYYY-MM-DD.log`.
- **Background Startup Services**: For self-hosted deployments (Docker or Local Dev) where a valid `DATABASE_URL` is configured (excluding standard Vercel serverless runs):
  - **Gateway Service**: Initiates `GatewayService.ensureRunning()` to reconnect persistent bots and handle communication channels.
  - **Knowledge Bootstrap**: Initiates `KnowledgeBootstrapService.bootstrapOnce()` to sync files from the disk-based knowledge seed directory to the database. In local development mode, this requires `ENABLE_BOT_IN_DEV=1` to run.
