---
name: general-review
description: Comprehensive general review checklist for evaluating the Jemmia LobeHub codebase. Triggers when the user asks for a 'general review', 'review the codebase', 'check everything', or 'kiểm tra tổng thể'.
---

# General Codebase Review Checklist

This skill is the authoritative review guide for the Jemmia Diamond LobeHub fork. It is derived from the full commit history of the internal team (Mar 11 – Apr 21, 2026, 244+ commits) and covers every feature area that has been built, modified, or protected.

Run this checklist after upstream merges, before deployments, or when asked for a general review.

---

## 1. CI/CD & Deployment Pipeline

- [ ] **GHCR build workflow** (`.github/workflows/deploy-ghcr.yml`): branch targets correct (`canary`), image pullability verified before Dokploy webhook fires, image digest included in payload
- [ ] **Dokploy webhook**: POST triggers correctly after image is confirmed pullable (30s sleep or pullability check in place)
- [ ] **Docker Compose**: `docker-compose/deploy/docker-compose.yml` uses correct image tag (`latest` vs `canary`), memory limits set (8–10GB heap), sourcemaps disabled in build
- [ ] **NODE_OPTIONS**: heap memory set to `--max-old-space-size=8192` (or 10240) in Dockerfile and build scripts to prevent OOM
- [ ] **Upstream auto-sync**: `.github/workflows/sync-upstream.yml` runs correctly, merge conflicts reported, PAT not required (uses `secrets.GITHUB_TOKEN`)
- [ ] **Desktop build**: disabled in CI (`chore: disable desktop build`) — confirm it stays disabled
- [ ] **E2E tests**: disabled (`chore: disable e2e`) — confirm not accidentally re-enabled
- [ ] **Test CI**: temporarily disabled flag still intentional or re-enabled properly

---

## 2. Branding & Identity

- [ ] **App name**: All references use `@lobechat/business-const` constants (`ASSISTANT_NAME`, `ASSISTANT_TITLE`, `ORG_NAME`) — no hardcoded "Jemmora", "Jemos", "LobeChat" strings in user-facing text
- [ ] **Splash screen**: Uses Jemmia/Brainy logo, not upstream LobeHub logo
- [ ] **Favicons**: All sizes replaced (16×16, 32×32, 48×48, 180×180, 192×192, 512×512) with Brainy assets
- [ ] **BeautiqueDisplay font**: Applied to agent names in chat (`ChatItem/components/Title.tsx`)
- [ ] **Theme**: Default theme is `light` (not dark), set in global config
- [ ] **Branding color**: Updated to Jemmia palette
- [ ] **Footer**: Removed from `AuthCard`
- [ ] **Reaction bar**: Hidden (`feat: hide reaction bar`)
- [ ] **Theme toggle button**: Removed entirely (`feat: remove totally theme toggle button`)
- [ ] **Auth theme button**: Moved to feature flag `showAuthThemeButton`

---

## 3. Feature Flags (Hidden Upstream Features)

- [ ] **`commercial_hide_github`**: GitHub links hidden in UI
- [ ] **Resources tab**: Hidden via feature flag
- [ ] **Pages**: Hidden via feature flag
- [ ] **Help menu**: Hidden via feature flag
- [ ] **Image/video generation**: Hidden
- [ ] **Memory UI**: Hidden
- [ ] **Agent list in sidebar**: Hidden (`feat: hide agent list in sidebar`)
- [ ] **Onboarding flow**: Disabled (`feat: disable onboarding`)
- [ ] **Minimap scroll**: Hidden (`chore: update locale for date message, hide minimap scroll`)
- [ ] **Mention doc + upload from Lark**: Feature-flagged (`feat: temporarily hide mention doc + upload from lark`)
- [ ] **Default Google models**: Hidden — only 3 Jemmia proxy models exposed (`hide default google models + only keeps 3 model of jemmia`)
- [ ] **builtin-agent-onboarding**: Removed (`chore: remove builtin-agent-onboarding`)

---

## 4. Localization (i18n)

- [ ] **Default language**: `vi-VN` is the fallback in ALL `i18next.init()` calls — never `en-US`
- [ ] **JSON routing**: `vi-VN` loads from `locales/vi-VN/*.json`, never routed to `src/locales/default/*.ts` (English TS source)
- [ ] **`plugin` namespace bundled**: `locales/vi-VN/plugin.json` imported and included in `createBundledResources()` in `src/locales/create.ts` — prevents raw key flash on first render
- [ ] **New UI text**: Any new hardcoded strings extracted to `locales/vi-VN/*.json` and `src/locales/default/*.ts`
- [ ] **`createAuthI18n`**: No redundant `vi-VN` locale check routing to English fallback

---

## 5. AI Model Routing (Jemmia Provider)

- [ ] **3 modes exposed**: `fast` (gemini-2.5-flash-lite), `thinking` (gemini-2.5-flash), `expert` (gemini-2.5-pro) — no other models shown to users
- [ ] **`auto` mode**: `beforeChat` hook calls `evaluate()` (LLM-based, 30s timeout) → falls back to `resolve()` (static heuristics) on failure
- [ ] **Static heuristics** (`resolve()`): 3+ files OR >256k tokens → expert; KB tool OR knowledge injected OR Lark OR 1-2 files OR >128k tokens → thinking; else → fast
- [ ] **KB tool upgrade**: When `lobe-knowledge-base` is in tools and `evaluate()` picks FAST → automatically upgraded to THINKING (prevents Vietnamese stream corruption)
- [ ] **`generateObject` JSON parsing**: Extracts JSON from markdown code blocks when LLM returns mixed text+JSON
- [ ] **Token streaming fix**: `openai.ts` uses `tool_calls.map()` not `item.delta.tool_calls.map()`
- [ ] **`beforeGenerateObject` hook**: Also applies mode resolution for model routing calls

---

## 6. Inbox Agent (Brainy) — System Role & Behavior

- [ ] **System role template**: `packages/builtin-agents/src/agents/inbox/systemRole.ts` and `packages/const/src/settings/agent.ts` are in sync
- [ ] **User profile injection**: `fetchLarkUserProfile()` injects name, jobTitle, unit, department into `## USER PROFILE` section
- [ ] **Fallback inference**: If department/unit missing, inferred from job title mapping (CEO→Management, Developer→Công nghệ, etc.)
- [ ] **KB always enabled**: `hasEnabledKnowledgeBases = true` for inbox agent in `aiAgent/index.ts`
- [ ] **Memory always enabled**: `globalMemoryEnabled = true` for inbox agent
- [ ] **Web search always on**: `searchMode = 'auto'` for inbox agent
- [ ] **Auto-run approval**: `approvalMode = 'auto-run'` enforced for inbox agent (no human approval pauses)
- [ ] **Knowledge-First mandate**: System role instructs `lobe-knowledge-base` called FIRST for any Jemmia-related query
- [ ] **Lark Approval links**: 20+ deep links present in system role (HR, Finance, Marketing, Supply, Production)
- [ ] **NAVIGATION & ESCALATION**: Salary/payroll → Finance (not IT); IT ticket only for technical issues
- [ ] **Ứng lương note**: Explicit note that salary advance has no Lark form → escalate to Finance/HCNS
- [ ] **Emoji rule**: Optional, inline only, never at end of response
- [ ] **Pronouns**: Brainy/mình, bạn, chúng mình — never họ/chúng tôi
- [ ] **JEMMIA-CENTRIC interpretation**: Ambiguous questions default to Jemmia context
- [ ] **Zero hallucination**: Never fill gaps with training data; KB → web → escalate fallback chain
- [ ] **Footnote format**: `[^N]` inline + `[^N]: [name](url)` definition — never `[^1^]` or escaped brackets
- [ ] **Temperature**: 0.6 (not default 1.0) for higher accuracy

---

## 7. Knowledge Base & RAG Pipeline

- [ ] **Seed directory**: `packages/knowledge-seed/jemmia-diamond/` — all `.md`/`.pdf`/`.docx` files auto-indexed on startup
- [ ] **`KnowledgeBootstrapService`**: Handles create/update (SHA-256 hash)/delete/rename — `globalKbId` set AFTER all files indexed
- [ ] **`isKbReady` guard**: Inbox agent waits up to 5s for KB bootstrap before processing chat
- [ ] **Embedding model**: `gemini-embedding-2-preview` at 3072 dimensions (`halfvec` HNSW index)
- [ ] **Embedding retry**: Exponential backoff (10s, 20s, 40s, 80s, 160s) on 429 rate limit
- [ ] **Backup API key**: `GOOGLE_API_KEY_BACKUP` fallback when primary key exhausted
- [ ] **Batch size**: 5 chunks per embedding batch, 500ms throttle between batches
- [ ] **`R2_TO_LARK_MAP`**: `src/config/r2ToLarkMapping.ts` is single source of truth — `JEMMIA_KNOWLEDGE_FILES` typed record with `label` + `larkUrl` per file
- [ ] **Citation URLs**: KB footnotes use Lark wiki URLs (not R2 URLs) via `formatSearchResults.ts` + `citationUrl` attribute
- [ ] **Web browsing fallback**: `lobe-web-browsing` mandatory when KB returns no results — crawls R2 files directly before general web search
- [ ] **Web browsing cites Lark**: Uses `[lark: ...]` URL from KB list, not R2 URL
- [ ] **Scanned PDFs**: `PdfLoader` uses `pdf-parse` (text extraction only) — scanned image PDFs return 0 chunks silently. No OCR implemented yet.
- [ ] **Adding/renaming KB files**: Update ONLY `src/config/r2ToLarkMapping.ts` — everything else derives automatically

---

## 8. Lark Integration

- [ ] **OAuth**: `src/libs/better-auth/sso/providers/lark.ts` intact
- [ ] **User profile fetch**: `fetchLarkUserProfile()` in `src/server/routers/lambda/user.ts` — fetches from `/authen/v1/user_info` + `/contact/v3/users/{union_id}` + `/contact/v3/departments/{deptId}`
- [ ] **Silent login**: `src/hooks/useLarkSilentLogin.ts` handles token refresh in Lark embedded webview
- [ ] **`LARK_BASE_URL` constant**: Used everywhere instead of hardcoded URLs
- [ ] **Lark doc link mapping**: `src/components/Link.tsx` applies `getLarkUrlForR2` for all external links
- [ ] **Inline citation `[1]` click**: `src/features/Conversation/Markdown/index.tsx` — `{...props}` spread BEFORE explicit `href`/`target`/`onClick` so redirect always wins
- [ ] **Footnote card click**: `Link.tsx` applies `getLarkUrlForR2` for footnote section links
- [ ] **Portal close on topic switch**: `ChatHydration` subscribes to `activeTopicId` changes and calls `clearPortalStack()` — file preview panel closes when switching topics

---

## 9. Chat UI & Input

- [ ] **`JemChatInput`**: Custom send button, stop generation button, no input border, correct padding
- [ ] **Mode selector**: Fast/Thinking/Expert buttons visible in chat input
- [ ] **Auto-hide left panel**: On small screens, left panel auto-hides on init
- [ ] **Mobile unsupported screen**: `SPAGlobalProvider/index.tsx` shows Vietnamese "not supported" screen for `isMobile` or `window.innerWidth < 768`
- [ ] **File detail button**: File list items in chat have "Xem chi tiết" button that opens portal
- [ ] **Portal close on topic switch**: File preview panel resets when switching topics (see §8)
- [ ] **Multimodal suppression tags**: Injected file context wrapped in suppression tags to prioritize new files
- [ ] **Scan image support**: Files with scanned images passed to model for vision understanding

---

## 10. File Preview (Portal)

- [ ] **DOCX preview**: `MammothViewer` component renders `.docx` files client-side via `mammoth` library (no external service needed)
- [ ] **MSDocViewer routing**: `name?.toLowerCase().endsWith('.docx')` → `MammothViewer`; other MS docs → iframe renderer
- [ ] **`name` prop**: Passed from `FileViewer` → `MSDocViewer` → routing logic
- [ ] **Portal state**: `openFilePreview({ fileId })` sets `showPortal: true` and pushes `FilePreview` view
- [ ] **Error handling**: `FilePreview/Body` shows loading spinner if `getFileItemById` returns `NOT_FOUND` — consider adding error state
- [ ] **Lark doc files**: `id.startsWith('lark-')` → `openLarkPreview(url, name)` → iframe in `LarkPreview` portal

---

## 11. Gateway & Streaming Stability

- [ ] **`streamingExecutor.ts`**: try/catch/finally wraps agent runtime loop; `failOperation()` on crash; `default:` case calls `completeOperation()`
- [ ] **`gateway.ts`**: `receivedTerminalEvent` guard; `onOperationCancel` with tRPC interrupt; `onSessionError` clears `topicLoading`
- [ ] **`gatewayEventHandler.ts`**: `tool_execute` handler present; `gatewayOperationId` fix; `ToolExecuteData` import
- [ ] **Stop button**: Cancels both `execAgentRuntime` and `execServerAgentRuntime` ops
- [ ] **`isAborting` flag**: Set for gateway ops in `operation/actions.ts`
- [ ] **FK violation fail-fast**: `RuntimeExecutors.ts` + `messagePersistErrors.ts` fail fast on FK violations

---

## 12. Inspector Components (Tool UI)

- [ ] **`plugin` namespace bundled**: `src/locales/create.ts` imports `locales/vi-VN/plugin.json` and includes in `createBundledResources()` — no lazy-load flash
- [ ] **KB inspector `defaultValue`**: `SearchKnowledgeBaseInspector` and `ReadKnowledgeInspector` have Vietnamese `defaultValue` fallbacks
- [ ] **Web browsing inspector `defaultValue`**: `CrawlMultiPages`, `CrawlSinglePage`, `Search` inspectors have Vietnamese `defaultValue` fallbacks
- [ ] **`workflow.toolDisplayName.searchKnowledgeBase`**: Present in `locales/vi-VN/chat.json` as `"Đã tìm kiếm cơ sở kiến thức"`

---

## 13. Database & Migrations

- [ ] **Embedding dimensions**: `halfvec` column at 3072 dims for KB chunks; user memory tables stay at 1024 dims (`_1024` suffix) — do not change
- [ ] **Migration SQL**: `statement-breakpoint` comments required in all migration SQL files for PGlite compatibility
- [ ] **Migrations generated**: Always use `pnpm db:generate` — never manually write SQL
- [ ] **Schema conflicts**: Resolved correctly after upstream merges (check `feat: resolve schema conflict`)

---

## 14. Package Management & Build

- [ ] **Package manager**: `pnpm` for installs; `bun run` for scripts; `bunx` for executables
- [ ] **Lexical**: Upgraded to `0.42.0` — verify no regressions in rich text editor
- [ ] **`react-pdf/image`**: Overridden (`chore: override react-pdf/image`) — check override still in place after upstream merges
- [ ] **SPA build directory**: `_spa` (not default) — verify in build config
- [ ] **Type check**: Run `bun run type-check` after significant changes

---

## 15. Known Gaps / Not Yet Implemented

- [ ] **OCR for scanned PDFs**: `ContentChunk` has `doc2x` stub (`// Future implementation`) — scanned PDFs silently produce 0 chunks
- [ ] **Large file handling (>25MB)**: No explicit size guard in `KnowledgeBootstrapService.syncSeedFile()` — `fs.readFileSync` reads entire file
- [ ] **Topic history pagination**: `useFetchTopics` supports `pageSize` + `loadMoreTopics` — verify "load more" scroll trigger is wired in sidebar `FlatMode`/`ByTimeMode`
- [ ] **Topic list refresh on new topic**: Verify `refreshTopic()` + `FETCH_RECENTS_KEY` SWR invalidation fires after new topic created
- [ ] **File preview error state**: `FilePreview/Body` shows infinite spinner on `NOT_FOUND` — no error UI
