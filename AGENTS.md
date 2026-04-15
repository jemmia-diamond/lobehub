# LobeHub Development Guidelines

This document serves as a comprehensive guide for all team members when developing LobeHub.

## Project Description

You are developing an open-source, modern-design AI Agent Workspace: LobeHub (previously LobeChat).

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: Ant Design, @lobehub/ui, antd-style
- **State Management**: Zustand, SWR
- **Database**: PostgreSQL, PGLite, Drizzle ORM
- **Testing**: Vitest, Testing Library
- **Package Manager**: pnpm (monorepo structure)

## Directory Structure

```plaintext
lobehub/
├── apps/desktop/           # Electron desktop app
├── packages/               # Shared packages (@lobechat/*)
│   ├── database/           # Database schemas, models, repositories
│   ├── agent-runtime/      # Agent runtime
│   └── ...
├── src/
│   ├── app/                # Next.js app router
│   ├── spa/                # SPA entry points (entry.*.tsx) and router config
│   ├── routes/             # SPA page components (roots)
│   ├── features/           # Business components by domain
│   ├── store/              # Zustand stores
│   ├── services/           # Client services
│   ├── server/             # Server services and routers
│   └── ...
├── .agents/skills/         # AI development skills
└── e2e/                    # E2E tests (Cucumber + Playwright)
```

## Architecture Diagrams

Two sequence diagrams document the core flows. Always read them before modifying auth or chat code:

- **Authentication flow**: `.agents/diagrams/auth-flow.md` — covers email/password login and Lark SSO OAuth
- **Core chat flow**: `.agents/diagrams/core-chat-flow.md` — covers message send → model routing → KB/RAG → streaming response

## Core Chat Architecture

### Chat Modes (Jemmia Provider)

The Jemmia provider (`src/server/modules/ModelRuntime/index.ts`) intercepts every chat request via `beforeChat` hook and resolves the model before it reaches aiproxy:

| Mode | Model | How |
|------|-------|-----|
| `auto` | Decided at runtime | 1. `evaluate()` — LLM picks model (15s timeout) → 2. `resolve()` — static heuristics fallback |
| `fast` | `gemini-2.5-flash-lite` | Direct `resolve()`, no LLM call |
| `thinking` | `gemini-2.5-flash` | Direct `resolve()`, no LLM call |
| `expert` | `gemini-2.5-pro` | Direct `resolve()`, no LLM call |

**Auto mode static heuristics** (`src/server/services/modelRouter/index.ts`):
- 3+ files OR >256k tokens → `expert`
- KB injected OR Lark integration OR 1-2 files OR >128k tokens → `thinking`
- Everything else → `fast`

### Knowledge Base vs Web Browsing (R2 Fallback)

Two separate knowledge sources — never mix their citation behavior:

**KB Tool** (`knowledge-base`):
- Searches indexed local markdown files via pgvector (3072-dim embeddings, `gemini-embedding-2-preview`)
- Returns relevant chunks to the LLM
- **Never generates R2 URL citations** — data is internal, no external URL needed

**Web Browsing Tool** (fallback KB):
- Used when KB returns no results, or for real-time web search
- Contains hardcoded R2 URLs for Jemmia documents (`packages/builtin-tool-web-browsing/src/systemRole.ts`)
- Crawls R2 markdown files directly via `crawlSinglePage`/`crawlMultiPages`
- **Cites R2 URLs in footnotes** → `getLarkUrlForR2()` maps them to Lark wiki URLs on click

**Rule**: If you see R2 URL citations in a response that came from the KB tool, that is a bug. R2 citations only belong to web browsing tool responses.

### Embedding Dimensions

The RAG pipeline uses `gemini-embedding-2-preview` at **3072 dimensions** (native). The pgvector column uses a `halfvec` HNSW index cast for performance (pgvector 0.8+ supports halfvec up to 4000 dims). User memory tables intentionally stay at 1024 dims (`_1024` suffix columns) — different model, do not change.

## Development Workflow

### Git Workflow

- **Branch strategy**: `canary` is the development branch (cloud production); `main` is the release branch (periodically cherry-picks from canary)
- New branches should be created from `canary`; PRs should target `canary`
- Use rebase for git pull
- Git commit messages should prefix with gitmoji
- Git branch name format: `feat/feature-name`
- Use `.github/PULL_REQUEST_TEMPLATE.md` for PR descriptions
- **Protection of local changes**: Never use `git restore`, `git checkout --`, `git reset --hard`, or any other command or workflow that can forcibly overwrite, discard, or silently replace user-owned uncommitted changes. Before any revert or restoration affecting existing files, inspect the working tree carefully and obtain explicit user confirmation.

### Package Management

- Use `pnpm` as the primary package manager
- Use `bun` to run npm scripts
- Use `bunx` to run executable npm packages

### Code Style Guidelines

#### TypeScript

- Prefer interfaces over types for object shapes

### Testing Strategy

```bash
# Web tests
bunx vitest run --silent='passed-only' '[file-path-pattern]'

# Package tests (e.g., database)
cd packages/[package-name] && bunx vitest run --silent='passed-only' '[file-path-pattern]'
```

**Important Notes**:

- Wrap file paths in single quotes to avoid shell expansion
- Never run `bun run test` - this runs all tests and takes \~10 minutes

### Type Checking

- Use `bun run type-check` to check for type errors

### i18n

- **Keys**: Add to `src/locales/default/namespace.ts`
- **Dev**: Translate `locales/zh-CN/namespace.json` locale file only for preview
- DON'T run `pnpm i18n`, let CI auto handle it

#### Default Language: `vi-VN`

The app's default language is **`vi-VN` (Vietnamese)**. Key facts:

- `vi-VN` translations live in **JSON files** at `locales/vi-VN/*.json`
- `src/locales/default/*.ts` are **English** TypeScript source files — NOT vi-VN translations
- All locales including `vi-VN` must load from `locales/<locale>/*.json`
- `fallbackLng` must be `'vi-VN'` (not `'en-US'`) in all i18next `init()` calls

**Rule**: Never route `vi-VN` (or `defaultLang`) to `src/locales/default/*.ts`. Always load from JSON:

```ts
// CORRECT — all locales load from JSON
try {
  return import(`@/../locales/${normalizedLocale}/${ns}.json`);
} catch {
  return import(`@/../locales/${defaultLang}/${ns}.json`); // fallback to vi-VN JSON
}

// WRONG — routes vi-VN to English TypeScript source files
if (normalizedLocale === defaultLang) return import(`@/locales/default/${ns}`);
if (normalizedLocale === 'vi-VN') return import(`@/locales/default/${ns}`);
```

This mistake has been introduced multiple times. Every time `vi-VN` is routed to `src/locales/default/*.ts`, users see English.

## SPA Routes and Features

- **`src/routes/`** holds only page segments (`_layout/index.tsx`, `index.tsx`, `[id]/index.tsx`). Keep route files **thin** — import from `@/features/*` and compose, no business logic.
- **`src/features/`** holds business components by **domain** (e.g. `Pages`, `PageEditor`, `Home`). Layout pieces, hooks, and domain UI go here.
- **Desktop router parity:** When changing the main SPA route tree, update **both** `src/spa/router/desktopRouter.config.tsx` (dynamic imports) and `src/spa/router/desktopRouter.config.desktop.tsx` (sync imports) so paths and nesting match. Changing only one can leave routes unregistered and cause **blank screens**.
- See the **spa-routes** skill (`.agents/skills/spa-routes/SKILL.md`) for the full convention and file-division rules.

## Skills (Auto-loaded)

All AI development skills are available in `.agents/skills/` directory and auto-loaded by Claude Code when relevant.

**IMPORTANT**: When reviewing PRs or code diffs, ALWAYS read `.agents/skills/code-review/SKILL.md` first.
