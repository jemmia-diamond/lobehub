# Jemmia Brainy Development Guidelines

This document serves as a comprehensive guide for all team members when developing Brainy.

## Project Description

You are developing an open-source, modern-design AI Agent Workspace: Brainy forked from lobehub:lobehub and developed by Jemmia Diamond's Tech Team.
This is a **Jemmia Diamond internal self-host deployment** — the default language is Vietnamese, the default agent is Brainy (Jemmia's internal AI assistant).

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
├── packages/knowledge-seed/jemmia-diamond/  # Jemmia KB seed files (auto-indexed on startup)
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
- KB tool present OR `Knowledge-First` in system prompt OR Lark integration OR 1-2 files OR >128k tokens → `thinking`
- Everything else → `fast`

**Important**: When KB tool (`lobe-knowledge-base`) is in the tool list and `evaluate()` picks FAST, it is automatically upgraded to THINKING. FAST model (`gemini-2.5-flash-lite`) corrupts long Vietnamese tool names causing stream corruption artifacts (e.g. "ETF" appearing in responses).

### Inbox Agent (Brainy)

The inbox agent is Jemmia's internal AI assistant. Key behaviors enforced server-side regardless of user settings:

- **KB always enabled**: `hasEnabledKnowledgeBases = true` for inbox agent (`src/server/services/aiAgent/index.ts`)
- **Memory follows standard logic**: Agent-level config takes priority, falls back to user setting (`globalMemoryEnabled = agentMemoryEnabled ?? memorySettings?.enabled !== false`)
- **Web search always on**: `searchMode = 'auto'`
- **KB tool in plugins**: `KnowledgeBaseIdentifier` added to inbox agent plugins (`packages/builtin-agents/src/agents/inbox/index.ts`)

**User profile injection**: On app entry, `fetchLarkUserProfile()` fetches name, jobTitle, department, email, unit from Lark API and injects into system role as `## USER PROFILE` section. This gives the agent context about who it's talking to.

### Knowledge Base vs Web Browsing (R2 Fallback)

Two separate knowledge sources — never mix their citation behavior:

**KB Tool** (`lobe-knowledge-base`):
- Searches indexed local markdown files via pgvector (3072-dim embeddings, `gemini-embedding-2-preview`)
- Returns relevant chunks to the LLM
- **Cites Lark URLs directly** via `formatSearchResults.ts` — when file has `local://jemmia-diamond/` URL, the Lark wiki URL is looked up from `R2_TO_LARK_MAP` and passed as `citationUrl` attribute. The LLM is instructed to use `[^1]: [filename](citationUrl)` footnotes.
- **No citation when Lark URL is missing** — if no Lark mapping exists for the file, no `citationUrl` attribute is added and the LLM provides the answer without footnote citation
- `R2_TO_LARK_MAP` is passed from `executor/index.ts` (client) which imports from `src/config/r2ToLarkMapping.ts`

**Web Browsing Tool** (`lobe-web-browsing`):
- Used when KB returns no results, or for real-time web search
- Knowledge base list generated from `buildKnowledgeBaseList()` in `src/config/r2ToLarkMapping.ts` — format: `- label\n  - crawl: r2Url\n  - cite: larkUrl` (cite line omitted when larkUrl is empty)
- Crawls R2 markdown files directly via `crawlSinglePage`/`crawlMultiPages`
- **Cites Lark URLs directly** — instructed to use the `cite:` URL from the KB list when available, not the R2 URL
- **No citation when Lark URL is missing** — if no `cite:` entry exists for a file, provides the answer without footnote citation

### Citation Types

| Type | Source | Component | Click Behavior |
|------|--------|-----------|----------------|
| Web search | `lobe-web-browsing` | `SearchGrounding.tsx` | Open URL directly |
| KB chunks | `lobe-knowledge-base` | `FileChunks.tsx` | Internal file preview |
| KB footnotes | `lobe-knowledge-base` | `Markdown/index.tsx` | Lark URL directly (no redirect needed) |
| Web browsing R2 | `lobe-web-browsing` | `Markdown/index.tsx` | Lark URL directly (no redirect needed) |
| Model-native | LLM provider (Google/OpenAI) | `SearchGrounding.tsx` | Open URL directly |

**R2→Lark mapping**: `src/config/r2ToLarkMapping.ts` — single source of truth. Contains `JEMMIA_KNOWLEDGE_FILES` with `label`, `larkUrl` per file. Exports:
- `R2_TO_LARK_MAP` — passed to `formatSearchResults()` for KB citations
- `buildKnowledgeBaseList()` — used in web browsing systemRole
- `getLarkUrlForR2()` — used in `Markdown/index.tsx` and `Link.tsx` as fallback redirect for any R2 URLs that slip through

**When adding/renaming knowledge files**: update ONLY `src/config/r2ToLarkMapping.ts`. Everything else derives from it automatically.

### Knowledge Bootstrap

Jemmia knowledge files live in `packages/knowledge-seed/jemmia-diamond/`. On every server startup, `KnowledgeBootstrapService` syncs them to the DB:

- **Create**: new file on disk → indexed automatically
- **Update**: SHA-256 hash change detected → old record deleted → re-indexed
- **Delete**: file removed from disk → DB record deleted (cascades to chunks/embeddings)
- **Rename**: same hash, different URL → record updated in-place (no re-embedding cost)

URL format: `local://jemmia-diamond/filename.md` — used as stable key for deletion detection.

### Embedding Dimensions

The RAG pipeline uses `gemini-embedding-2-preview` at **3072 dimensions** (native). The pgvector column uses a `halfvec` HNSW index cast for performance (pgvector 0.8+ supports halfvec up to 4000 dims). User memory tables intentionally stay at 1024 dims (`_1024` suffix columns) — different model, do not change.

### Stale Loading Fixes

The operation lifecycle (`src/store/chat/slices/aiChat/actions/streamingExecutor.ts`) wraps the agent runtime loop in try/catch/finally:
- Any crash → `failOperation()` clears loading state
- Loop exits with unexpected status → `default:` case calls `completeOperation()`
- Gateway disconnect/error → `failOperation()` via `gateway.ts` and `gatewayEventHandler.ts`
- Gateway disconnect without terminal event → `onSessionError` callback clears `topicLoading` (both `executeGatewayAgent` and `reconnectToGatewayOperation`)
- Stop button cancels both `execAgentRuntime` and `execServerAgentRuntime` ops

## Development Workflow

### Git Workflow

- **Branch strategy**: `canary` is the development branch (cloud production); `main` is the release branch (periodically cherry-picks from canary)
- New branches should be created from `canary`; PRs should target `canary`
- Use rebase for git pull
- Git commit messages should prefix with gitmoji
- Git branch name format: `feat/feature-name`
- Use `.github/PULL_REQUEST_TEMPLATE.md` for PR descriptions
- **Protection of local changes**: Never use `git restore`, `git checkout --`, `git reset --hard`, or any other command or workflow that can forcibly overwrite, discard, or silently replace user-owned uncommitted changes. Before any revert or restoration affecting existing files, inspect the working tree carefully and obtain explicit user confirmation.
- **Commit permission**: NEVER add files to git (`git add`) or commit changes (`git commit`) without explicit user permission. Always ask before staging or committing any changes.

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

- **Rule (CRITICAL)**: When introducing new text that is displayed to the user, you MUST add it to the Vietnamese (`vi-VN`) locale files (JSON), and you SHOULD add it to the English (`default`) TS source files. Do not hardcode user-facing text in components.
- **Keys**: Add to `src/locales/default/namespace.ts`
- **Dev**: Translate `locales/vi-VN/namespace.json` locale file manually.
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

## Jemmia-Specific Configuration

### System Prompt Files
- **Inbox agent**: `packages/builtin-agents/src/agents/inbox/systemRole.ts` — runtime system role with user profile injection
- **Default agent config**: `packages/const/src/settings/agent.ts` — static system role for DB-seeded config

Both files must be kept in sync. The inbox `systemRole.ts` takes precedence at runtime.

### Lark Integration
- **OAuth**: `src/libs/better-auth/sso/providers/lark.ts`
- **User profile fetch**: `src/server/routers/lambda/user.ts` → `fetchLarkUserProfile()` — fetches from Lark Contact API using tenant token
- **Silent login**: `src/hooks/useLarkSilentLogin.ts` — handles token refresh in Lark embedded webview
- **R2→Lark mapping**: `src/config/r2ToLarkMapping.ts` — update when adding/renaming knowledge files

### Knowledge Files
- Location: `packages/knowledge-seed/jemmia-diamond/`
- Format: Markdown (`.md`)
- Auto-indexed on server startup via `KnowledgeBootstrapService`
- After adding/renaming files, update ONLY:
  1. `src/config/r2ToLarkMapping.ts` — add filename → Lark wiki URL mapping (single source of truth)
  - `buildKnowledgeBaseList()` for web browsing systemRole is auto-derived
  - `R2_TO_LARK_MAP` for KB citation URLs is auto-derived
  - `getLarkUrlForR2()` redirect fallback is auto-derived

### Feature Flags
Feature flags are defined in `src/config/featureFlags/schema.ts`. All flags can be either:
- **Boolean**: `true`/`false` for all users
- **Array of user IDs**: `['user-id-1', 'user-id-2']` for per-user enablement

Key flags for Jemmia deployment:
- `enable_command_palette: false` — Disables Command Palette (Cmd+K / Ctrl+K) globally. Set to `false` by default to prevent accidental triggers.
- `auth_sso_lark: true` — Enables Lark SSO OAuth login
- `knowledge_base: true` — Enables knowledge base features
- `enable_tools: true` — Enables tool/plugin system
- `enable_model: true` — Enables model selection UI

To modify defaults, edit `DEFAULT_FEATURE_FLAGS` in `schema.ts`. The `mapFeatureFlagsEnvToState()` function maps flags to store state using `evaluateFeatureFlag()`.

## Skills (Auto-loaded)

All AI development skills are available in `.agents/skills/` directory and auto-loaded by Claude Code when relevant.

**IMPORTANT**: When reviewing PRs or code diffs, ALWAYS read `.agents/skills/code-review/SKILL.md` first.

**IMPORTANT**: When converting knowledge from raw files (docx) to markdown, ALWAYS read `.agents/skills/docx-to-markdown/SKILL.md` to handle read and convert file
