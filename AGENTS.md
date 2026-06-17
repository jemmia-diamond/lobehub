# Jemmia Brainy Development Guidelines

This document serves as a comprehensive guide for all team members and AI Agents when developing Brainy.

> [!IMPORTANT]
> **Architecture & Self-Hosting Context**
> If you are modifying Core Chat, Authentication, Sentry, Knowledge Base (RAG), or Deployment infrastructure, you MUST read the specific documentation under `docs/features/` first to understand the specific modifications made for the Jemmia Diamond deployment.

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

## Skills (Auto-loaded)

All AI development skills are available in `.agents/skills/` directory and auto-loaded by Claude Code when relevant.

**IMPORTANT**: When reviewing PRs or code diffs, ALWAYS read `.agents/skills/code-review/SKILL.md` first.

**IMPORTANT**: When converting knowledge from raw files (docx) to markdown, ALWAYS read `.agents/skills/docx-to-markdown/SKILL.md` to handle read and convert file
