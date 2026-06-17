# Model Routing & Core Chat Architecture

This document describes how Brainy intercepts chat messages, evaluates and routes them to optimal model tiers, injects Lark user profiles, and manages UI loading states.

---

## 1. Chat Tiers & Provider Resolution

The custom Jemmia model provider (`src/server/modules/ModelRuntime/index.ts`) intercepts chat completions in `beforeChat` and `beforeGenerateObject` before they are sent to the AI proxy:

| Mode       | Target LLM Model        | Resolution Mechanism                                                                                                                                                                       |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auto`     | Dynamic at runtime      | 1. Attempts to run LLM-based `evaluate()` (Timeout: 30s for chat, 15s for object extraction) to select the model. <br>2. On timeout or failure, falls back to local heuristic `resolve()`. |
| `fast`     | `gemini-2.5-flash-lite` | Directly resolves statically without LLM evaluation.                                                                                                                                       |
| `thinking` | `gemini-2.5-flash`      | Directly resolves statically without LLM evaluation.                                                                                                                                       |
| `expert`   | `gemini-2.5-pro`        | Directly resolves statically without LLM evaluation.                                                                                                                                       |

---

## 2. Heuristic Routing Rules (`resolve`)

If the dynamic LLM evaluation fails or the request defaults to heuristic resolution, `ModelRouterService.resolve` (`src/server/services/modelRouter/index.ts`) checks the chat context:

- **Tier 3 — EXPERT (`gemini-2.5-pro`)**: Activated if the conversation contains 3 or more uploaded files (`totalFiles >= 3`), or if the conversation tokens count exceeds 256,000 tokens.
- **Tier 2 — THINKING (`gemini-2.5-flash`)**: Activated if:
  - The conversation contains 1 or 2 uploaded files (`totalFiles > 0`).
  - System prompt contains knowledge base references (contains keywords like "Knowledge Base" or the system prompt length is greater than 2,000 tokens).
  - Lark integration is active (message content contains "Lark Document ID" or the tools array includes `lark-doc-reader`).
  - Conversation tokens count exceeds 128,000 tokens.
- **Tier 1 — FAST (`gemini-2.5-flash-lite`)**: Selected for all other standard or short queries.

### Mandatory Upgrade Rule for Knowledge Base Tool

If the request includes the internal Knowledge Base tool (`lobe-knowledge-base`) and the resolved model is `FAST` (`gemini-2.5-flash-lite`), the router **automatically forces an upgrade to THINKING (`gemini-2.5-flash`)**.

This prevents stream corruption. The `gemini-2.5-flash-lite` model often struggles to format long tool outputs containing complex Vietnamese schema keywords, producing corrupted streams (e.g., repeating random trailing words like "ETF").

---

## 3. Default Inbox Agent Configuration

The default Inbox Agent is the standard workspace assistant for all users. The following parameters are hardcoded and enforced on the server regardless of user setting overrides:

- **Knowledge Base Enforced**: `hasEnabledKnowledgeBases` is always forced to `true` at `src/server/services/aiAgent/index.ts`.
- **Plugins Attached**: `KnowledgeBaseIdentifier` is statically appended to the assistant's plugin list in `packages/builtin-agents/src/agents/inbox/index.ts`.
- **Web Search Enforced**: Web search mode (`searchMode`) is forced to `'auto'`.

### User Profile Prompt Injection

During chat initialization, the backend calls `fetchLarkUserProfile()` to retrieve the employee's details (Name, Job Title, Department, and Unit) from Lark. These properties are formatted into a markdown block under a `## USER PROFILE` section and appended to the agent's system prompt. This allows the AI to provide personalized responses based on the user's role.

If the department or unit fields are empty, the system attempts to infer the correct department from the job title (e.g., "CFO" yields "Tài chính - Kế toán").

---

## 4. Chat UI & Stale Loading States

The streaming coordination loop (`src/store/chat/slices/aiChat/actions/streamingExecutor.ts`) wraps the runtime loop in a try/catch/finally block to prevent infinite loading spinners in the chat window:

- Any runtime exception or network interruption triggers `failOperation()` to reset the loading states.
- When the websocket gateway disconnects unexpectedly, the `onSessionError` callback cleans up the `topicLoading` state.
- Clicking the "Stop" button in the UI cancels both client-side and server-side runtime operations (`execAgentRuntime` and `execServerAgentRuntime`).

---

## 5. Sidebar Topic Synchronization (Desktop/Electron)

To support the desktop app layout, conversation list updates use a dedicated store synchronization flow:

- **Recents as Data Source**: The desktop sidebar renders `RecentTopicItem` components from `useHomeStore(homeRecentSelectors.recents)`. The standard `TopicList` component is not mounted in the desktop build.
- **Store Mutation**: The `refreshTopic()` function in the chat store explicitly invokes `useHomeStore.getState().refreshRecents()` to update the sidebar directly, rather than waiting for SWR revalidation.
- **Lifecycle Synchronization**: Creating a new conversation requires the UI to wait (`await`) for the `mutate()` callback (which saves the topic and calls `refreshRecents()`) **before** invoking `router.push()`. Navigating away prematurely unmounts `activeAgentId` through `HomeAgentIdSync.useUnmount`, causing the store refresh to be skipped.
