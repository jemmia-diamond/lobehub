# Commit Summary — lamtungphan8@gmail.com

**Period**: Mar 11 – Apr 22, 2026 (43 days)
**Total commits**: 250+
**Branch**: `canary` → `main`

---

## Timeline Overview

| Week | Dates | Focus |
|:-----|:------|:------|
| Week 1 | Mar 11–16 | CI/CD pipeline, Docker, feature flags, initial branding |
| Week 2 | Mar 17–23 | UI layout, mode selection, Lark integration foundations |
| Week 3 | Mar 24–30 | Chat UI v2, file upload, agent routing, branding color |
| Week 4 | Mar 31–Apr 6 | Knowledge bootstrap, embedding upgrade, system prompt hardening |
| Week 5 | Apr 7–13 | RAG refinement, Lark citations, stale loading fixes, full branding |
| Week 6 | Apr 14–21 | Lark user profile, approval links, mobile guard, i18n fixes |
| Week 7 | Apr 22 | Bug fixes: topic list refresh, embedding key fallback, KB threshold |

---

## Phase 1 — Infrastructure & CI/CD (Mar 11–16)

**Goal**: Get the fork deployable on Dokploy with GHCR images.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Mar 11 | `7ff60b99` | Update Docker Compose configurations |
| Mar 11 | `c74181df` | Add GitHub Action for GHCR build and Dokploy deploy |
| Mar 11 | `7729d45c` | Introduce feature flags for core features |
| Mar 11 | `461eaf1e` | Fix lints |
| Mar 11–12 | multiple | Test/fix deploy pipeline, image tagging, webhook payload |
| Mar 12 | `aa568ef6` | Update Docker images for LobeHub |
| Mar 12 | `1c1a7a9e` | Add flags check |
| Mar 14 | `604f5821` | Add GitHub Actions workflow to auto-sync canary with upstream |
| Mar 15 | `9c147e66` | Setup version with tags |
| Mar 16 | `5d9843fe` | Add feature flags for Resource and Pages |
| Mar 16 | `f41b12c1` | Hide resources, help menu, pages |
| Mar 16 | `a16614b4` | Hide image/video generation, memory; fix locale |

**Summary**: Built the entire CI/CD pipeline from scratch — GHCR image build, Dokploy webhook deploy, upstream auto-sync. Added feature flags to hide upstream features not relevant to Jemmia (resources, pages, image gen, memory, GitHub links).

---

## Phase 2 — UI Foundation & Mode Selection (Mar 17–25)

**Goal**: Establish Jemmia-specific UI — mode selector, branding, Lark integration.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Mar 17 | `4e154f1d` | Hide default Google models, keep only 3 Jemmia models |
| Mar 19 | `1c42046d` | Manipulate Lark message |
| Mar 19 | `664db6f9` | Manipulate on Lark doc |
| Mar 21 | `4897571e` | Add thinking mode selection UI |
| Mar 21 | `db52bcac` | Simplify mobile detection logic |
| Mar 23 | `75d6d9ca` | Introduce Jemmia mode selection for inbox agents, refine header/conversation layouts |
| Mar 23 | `0a64d3fc` | Replace Jemos-specific header/chat input with generic components; add agent sidebar |
| Mar 25 | `e5fabe90` | Change branding, mention doc, search |
| Mar 26 | `5ae9cbad` | Set default lang to Vietnamese |
| Mar 26 | `63c83f60` | Hide agent list in sidebar |
| Mar 26 | `c3a79c3d` | Splash logo |

**Summary**: Introduced the 3-mode selector (Fast/Thinking/Expert) in the chat UI. Set Vietnamese as default language. Hid irrelevant upstream UI elements. Started Lark document integration.

---

## Phase 3 — Chat UI v2 & Agent Routing (Mar 28–Apr 2)

**Goal**: Rebuild chat input, implement auto-mode orchestration, stabilize UI.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Mar 30 | `4deec8e4` | Enhance agent routing, improve topic navigation, update chat input |
| Mar 30 | `90648542` | Constant LARK_BASE_URL |
| Mar 31 | `7ceff595` | Implement multimodal attachment detection, wrap injected context in suppression tags |
| Mar 31 | `013d182e` | Support understand file with scan image |
| Mar 31 | `dc252740` | Disable onboarding |
| Mar 31 | `aacce9fc` | Temporarily hide mention doc + upload from Lark |
| Mar 31 | `edc32677` | Implement direct file upload trigger and validation logic |
| Apr 1 | `bb01bb62` | Orchestrate auto mode |
| Apr 1 | `7245c4bb` | Replace hardcoded branding with business constants |
| Apr 1 | `5a4b2536` | Update system roles with organizational philosophy and branding |
| Apr 1 | `8ebad5bb` | Rebrand application to Jemmora, update support contact |
| Apr 2 | `c6130858` | Revisit changes |
| Apr 2 | `d5d2e02d` | Restore StoreUpdater |
| Apr 2 | `abcf4008` | Upgrade Lexical and related packages to 0.42.0 |

**Summary**: Implemented `auto` mode orchestration — `beforeChat` hook calls `evaluate()` (LLM-based routing) with `resolve()` as static fallback. Rebuilt chat input with custom send button and stop generation. Added multimodal file attachment detection. Replaced all hardcoded branding with `@lobechat/business-const` constants.

---

## Phase 4 — Knowledge Bootstrap & Embedding (Apr 3–9)

**Goal**: Build the RAG pipeline — seed files, embeddings, KB bootstrap, web browsing fallback.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Apr 3 | `5da0b1e0` | Implement global knowledge base bootstrapping; update agent system prompts for strict grounding |
| Apr 3 | `1f7fc09a` | Improve Jemmia mode synchronization, prioritize orchestration hooks in ModelRuntime |
| Apr 3 | `e8074688` | Increase build memory limits |
| Apr 3 | `2c3b36f7` | Increase NODE_OPTIONS heap memory to 10GB |
| Apr 5 | `83e92f6e` | Guide search browser as fallback |
| Apr 5 | `afe15f1f` | Fix system prompt |
| Apr 6 | `7d7fe51f` | Upgrade default embedding model to gemini-embedding-2-preview; implement rate-limit retry for knowledge indexing |
| Apr 6 | `9c85bd7e` | Centralize rate-limit retry logic, enable native KnowledgeBootstrap, wipe stale local embeddings |
| Apr 6 | `491476b2` | Add Knowledge-First Mandate to default agent setting |
| Apr 6 | `86e6485e` | Default locale to vi, theme to light |
| Apr 7 | `127ba937` | Update auto mode mechanism |
| Apr 7 | `28d942de` | Update model routing thresholds |
| Apr 7 | `1a606691` | Improve prompting |
| Apr 8 | `0d7408f0` | Replace hardcoded assistant name with constant |
| Apr 9 | `98bafae5` | Add new static knowledge base |
| Apr 9 | `d9ce0cdd` | Add exponential backoff retry for embedding 429 rate limit errors |
| Apr 9 | `58502fd1` | Fallback by search from R2 |
| Apr 9 | `491a4181` | Add tone, human-like manner |
| Apr 9 | `c890be6b` | Migrate S3 configuration to fileEnv, improve URL host validation |

**Summary**: Built `KnowledgeBootstrapService` — scans `packages/knowledge-seed/jemmia-diamond/` on startup, creates RAG indices, links to inbox agent. Upgraded embedding to `gemini-embedding-2-preview` at 3072 dimensions. Added exponential backoff retry for 429 rate limits. Implemented web browsing as fallback when KB returns no results. Tuned model routing thresholds (3+ files → expert, KB present → thinking).

---

## Phase 5 — RAG Refinement & Lark Citations (Apr 10–16)

**Goal**: Production-quality RAG — Lark URL citations, file sync, stale loading fixes, user profile injection.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Apr 10 | `f9a0f623` | Remove stale local embeddings migration script |
| Apr 10 | `f23d325b` | Remove redundant locale check for vi-VN in createAuthI18n |
| Apr 10 | `0a5f3af6` | Pull 2.1.47 from lobehub locales |
| Apr 10 | `bbebbe30` | Implement custom send button styles and stop generation in JemChatInput |
| Apr 11 | `7bbbbd78` | Implement synchronous RAG processing in file service |
| Apr 11 | `f0f909c1` | Centralize RAG indexing logic into new RagService |
| Apr 12 | `b3808748` | Update testcase |
| Apr 13 | `e6e7145d` | Handle click open Lark doc for footer citation |
| Apr 13 | `1fd8ec1a` | Map link to Lark doc |
| Apr 13 | `47578b01` | Add ticket link in navigation support |
| Apr 13 | `bba632c1` | Force vi |
| Apr 13 | `d6becbfb` | Update Brainy in index and splash html |
| Apr 13 | `aa0f7aee` | vi default + update AGENTS.md |
| Apr 13 | `3031978e` | Update branding + user navigation |
| Apr 13 | `cb01fd0a` | Show filename instead of full link citation |
| Apr 13 | `c7a4e12f` | Remove override language reply |
| Apr 13 | `8149a6b7` | Hide reaction bar |
| Apr 13 | `db687b64` | Fix CI, stale loading |
| Apr 14 | `2e49a958` | Update favicon 16x16 |
| Apr 14 | `2cf4914e` | Update favicon 32x32 |
| Apr 14 | `e27912cb` | Simplify title summarization prompt |
| Apr 15 | `7c36f76c` | Embedding size update to 3072 |
| Apr 15 | `7dc23721` | Add timeout for embedding |
| Apr 15 | `24b6d4e6` | Force vi, fix testing on RAG |
| Apr 15 | `1d324235` | Generate DB migration |
| Apr 15 | `9800adb1` | Update inbox agent system role for Vietnamese; reduce temperature to 0.6 |
| Apr 15 | `b274a30d` | Fix jemmia_diamond_knowledge_base wrong URL |
| Apr 16 | `db386446` | Inject Lark user profile into system role; improve error handling |
| Apr 16 | `2c0fc96c` | Remove managerName from Lark profile; update default agent temperature |
| Apr 16 | `e986ebb3` | Update conversation completion callback; fix Google generateObject test |
| Apr 16 | `e1925caa` | Add debug logging for model routing; update system role for Jemmia-centric ops |
| Apr 16 | `bb8f1669` | Implement robust gateway session management, server-side cancellation, error persistence |
| Apr 16 | `2da85a04` | Enhance Lark profile fetching, improve inbox agent capabilities, optimize message lifecycle |
| Apr 16 | `b26b54cb` | Update system prompt to be more friendly |
| Apr 16 | `4ed2bff3` | Implement file synchronization logic for seed files; update KB system role URLs |
| Apr 16 | `8f970ef7` | Add attendance regulation knowledge file |
| Apr 16 | `7592e393` | Add new knowledge file |
| Apr 16 | `5d4a8eac` | Resolve schema conflict |
| Apr 16 | `aa1dffe7` | Stress that user is employee |

**Summary**: Major production hardening sprint. Built `R2→Lark URL mapping` for citations — KB search results now cite Lark wiki URLs directly. Injected Lark user profile (name, job title, department, unit) into system role via `/contact/v3/users` API. Implemented robust gateway session management with server-side cancellation. Centralized RAG into `RagService`. Fixed stale loading states across `streamingExecutor`, `gateway`, `gatewayEventHandler`. Added 5 new knowledge files.

---

## Phase 6 — Polish, Stability & i18n (Apr 17–21)

**Goal**: Upstream sync, branding finalization, i18n fixes, mobile guard, escalation routing.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Apr 17 | `e0f8c5ea` | Add fallback default case on final state |
| Apr 17 | `6fc4a2a4` | Update knowledge |
| Apr 17 | `96a82fda` | Trigger build |
| Apr 18 | `39feab62` | Add approval links (Lark Approval deep links for all HR/Finance flows) |
| Apr 18 | `9aaa2f4b` | Update emoji prompt |
| Apr 18 | `17d31063` | Update hyperlink in Sổ Tay Hội Nhập Lark Suite |
| Apr 18 | `49dafb03` | Unify mapping data |
| Apr 18 | `174b734c` | Remove builtin-agent-onboarding |
| Apr 19 | `e22b0658` | Resolve merge conflicts |
| Apr 19 | `4d3b3cf3` | Remove dup |
| Apr 19 | `12ca09f2` | Update testcase |
| Apr 19 | `964df1bb` | Update testcase |
| Apr 19 | `8b1432ba` | Add unsupported mobile view |
| Apr 19 | `48f87d19` | Click on footnote and mini-citation — fix Lark URL redirect |
| Apr 19 | `5e634954` | Add cold start wait (5s) for KB bootstrap |
| Apr 19 | `343736d9` | Correct knowledge in Nội quy lao động |
| Apr 19 | `755f47dc` | Fix openai.ts token streaming; update calling |
| Apr 20 | `cfa8815f` | Cite Lark, enhance search R2; KB tool upgrades FAST→THINKING |
| Apr 20 | `c5373d0d` | Add fallback unit and department from job title |
| Apr 20 | `4ff6b859` | Update icon, new knowledge |
| Apr 20 | `916fbbae` | Update new branding |
| Apr 20 | `12771aeb` | Specify JEMMIA_KNOWLEDGE_FILES — typed per-file mapping |
| Apr 20 | `3d7c34d1` | Update logo (cont) |
| Apr 20 | `2ad72eea` | Retry for query embedding, fallback key |
| Apr 20 | `18259664` | Update 4 knowledge files; add docx-to-markdown SKILL |
| Apr 20 | `e9e4e350` | Enforce auto-run for inbox agent; update default tool intervention |
| Apr 21 | `32cd1c03` | Add custom BeautiqueDisplay font for agent names |
| Apr 21 | `06ca8c09` | Bundle `plugin` namespace at startup; fix inline citation click; add defaultValue fallbacks |
| Apr 21 | `9f691106` | Fix NAVIGATION & ESCALATION — salary advance → Finance, not IT |

**Summary**: Completed Lark Approval deep-link integration (20+ approval forms across HR/Finance/Marketing/Supply). Added mobile unsupported screen. Fixed inline `[1]` citation click not opening Lark URL (`{...props}` spread order bug). Fixed `plugin` i18n namespace not available on first render (now bundled). Added `GOOGLE_API_KEY_BACKUP` fallback for embedding. Enforced `auto-run` approval mode for inbox agent. Fixed salary advance being incorrectly routed to IT.

---

## Phase 7 — Bug Fixes & Embedding Hardening (Apr 22)

**Goal**: Fix topic list not refreshing after new conversation; harden embedding key fallback across all 3 embedding paths; reduce duplicate Lark profile fetches.

| Date | Hash | Description |
|:-----|:-----|:------------|
| Apr 22 | `010325a1` | Fix topic list refresh — call `refreshRecents()` directly; reorder Header button execution |
| Apr 22 | `d0af4484` | Refactor embedding key fallback to `GOOGLE_EMBEDDING_API_KEYS`; add memory embedding fallback; lower KB search threshold to 0.1; remove duplicate Lark profile fetch |

**Root cause (topic list)**: Desktop sidebar renders `recents` from `useHomeStore`, not `topicDataMap`. The agent `Sidebar/index.tsx` with `TopicList` is dead code — never imported on desktop. `refreshTopic` was invalidating SWR caches that nothing subscribed to. Fix: call `useHomeStore.getState().refreshRecents()` directly. Also: Header was navigating before `openNewTopicOrSaveTopic` completed, causing `refreshTopic` to run after `HomeAgentIdSync` cleared `activeAgentId`.

**Embedding key fallback**:
- New `src/server/utils/googleEmbeddingKeys.ts` — shared utility reading `GOOGLE_EMBEDDING_API_KEYS` (comma-separated), 3 retries per key before moving to next
- `embedding.ts` — KB indexing and user query embedding now use shared utility; `maxRetries: 0` on AI SDK calls to prevent double-retry
- `userMemories.ts` — memory search embedding now uses shared utility for Google/Jemmia provider; non-Google falls back to original `initModelRuntimeFromDB` path
- Removed `GOOGLE_API_KEY_BACKUP` / `GOOGLE_API_KEY_BACKUP_BACKUP` — replaced by single `GOOGLE_EMBEDDING_API_KEYS`

**Other fixes**:
- KB search similarity threshold lowered 0.5 → 0.1 in `formatSearchResults.ts` (LLM instruction)
- Removed redundant `getUserState` heartbeat from home layout (was causing duplicate Lark profile fetches on every reload)
- Updated Lark approval links (Late/Early, Resignation, Purchase-Payment)
- Auth sign-in subtitle changed from "Sign up or log in" → "Log in" (Jemmia is invite-only)
- Branding logo updated: `/images/brainy_logo.png` → `/logo.svg`
- Web browsing system role: clarified no-citation rule when KB entry has no `cite` URL; never use R2 crawl URL in footnotes
- `buildKnowledgeBaseList()` in `r2ToLarkMapping.ts`: omit `cite:` line when `larkUrl` is empty (was always emitting empty cite)
- `enable_command_palette` feature flag added (default `false`) — disables Cmd+K globally; hotkey respects the flag
- Footer: fixed empty `<Flexbox>` rendering when both help menu and settings are hidden

**Summary**: Fixed the long-standing topic list refresh bug (root cause: wrong data source — recents not topicDataMap). Unified all 3 embedding paths (KB indexing, query embedding, memory search) under a single `GOOGLE_EMBEDDING_API_KEYS` fallback chain with 3 retries per key. Eliminated duplicate Lark API calls on page load.

---

## Cumulative Achievements

### 🏗️ Infrastructure
- Full CI/CD pipeline: GHCR build → Dokploy webhook deploy → upstream auto-sync
- Docker memory tuning (10GB heap, optimized build)
- Feature flags for all upstream features not relevant to Jemmia

### 🤖 AI & Model Routing
- 3-tier model routing: `fast` (flash-lite) / `thinking` (flash) / `expert` (pro)
- `auto` mode: LLM-based `evaluate()` with static `resolve()` fallback
- KB tool present → always upgrade FAST to THINKING (prevents Vietnamese stream corruption)
- `beforeChat` hook intercepts every request before it reaches aiproxy

### 🧠 Knowledge Base & RAG
- `KnowledgeBootstrapService`: auto-indexes seed files on startup (create/update/delete/rename)
- 3072-dim embeddings via `gemini-embedding-2-preview`
- `GOOGLE_EMBEDDING_API_KEYS` — comma-separated key list, 3 retries per key, covers KB indexing + query embedding + memory search
- 19+ company documents indexed
- `R2→Lark URL mapping` — single source of truth for all citation URLs
- Web browsing as mandatory fallback when KB returns no results
- KB search similarity threshold: 0.1 (LLM instruction in `formatSearchResults.ts`)

### 🔗 Lark Integration
- User profile injection: name, job title, department, unit from Lark Contact API
- 20+ Lark Approval deep links embedded in system role
- Lark URL citations in KB footnotes and web browsing results
- Inline `[1]` and footnote card clicks both open Lark wiki URLs

### 🎨 Branding & UI
- Full rebrand: Jemmora → Brainy / Jemmia Diamond
- BeautiqueDisplay custom font for agent names
- Vietnamese default language, light theme default
- Mobile unsupported screen
- Hidden: reaction bar, image/video gen, memory, resources, pages, GitHub links, onboarding

### 🛡️ Stability
- Stale loading fixes across 8 files (streamingExecutor, gateway, gatewayEventHandler, etc.)
- Robust gateway session management with server-side cancellation
- `plugin` i18n namespace bundled at startup (no more raw key flash)
- Salary advance correctly escalated to Finance (not IT)
- Topic list refresh fixed — sidebar reads from `recents` (useHomeStore), not `topicDataMap`
- Duplicate Lark profile fetch eliminated (removed redundant getUserState heartbeat)

---

## Busiest Days

| Day | Commits | Focus |
|:----|:--------|:------|
| Apr 13 | 16 | Lark citations, branding, stale loading, CI fixes |
| Apr 16 | 13 | Lark profile injection, gateway stability, KB file sync |
| Apr 15 | 13 | Embedding upgrade, RAG fixes, system role Vietnamese |
| Mar 11 | 13 | CI/CD pipeline from scratch |
| Apr 03 | 12 | KB bootstrap, memory tuning, mode sync |
| Mar 31 | 11 | Chat UI v2, file upload, multimodal |
| Mar 12 | 11 | Deploy pipeline stabilization |
