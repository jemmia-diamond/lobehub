# Security & Access Control

This document describes Brainy's Zero-Trust deployment architecture, beta testing access controls, and feature flag evaluation system.

---

## 1. Zero-Trust Architecture

Brainy enforces a strict Zero-Trust security model in production to prevent credentials and API keys from leaking through the server filesystem.

### 1.1 Secrets Management via Infisical

- **No Local Environment Files**: No `.env` files are written to disk in production containers.
- **Direct RAM Injection**: Environment variables and API secrets are stored centrally in Infisical. The production Dockerfile (`docker-compose/deploy/Dockerfile.zerotrust`) uses the Infisical CLI as its `ENTRYPOINT`:
  ```dockerfile
  ENTRYPOINT ["infisical", "run", "--projectId", "79601934-6801-4afa-a075-60fcc40d90f8", "--env", "prod", "--path", "/brainy", "--", "/bin/node"]
  ```
  On container startup, the CLI fetches the secrets and injects them directly into the Node.js process RAM.
- **No Disk Cache Caching**: Temporary helper scripts like `deploy.sh` and `fetch-secrets.sh` are deleted in production to avoid storing secrets in clear text on the filesystem.

### 1.2 Infrastructure Network Isolation

In `docker-compose.yml`, internal backing services bind strictly to the loopback interface (`127.0.0.1`), blocking external connections from the internet:

- **PostgreSQL / pgvector**: Port `5432` binds to `127.0.0.1:5432`.
- **Redis Cache**: Port `6379` binds to `127.0.0.1:6379`.
- **RustFS Storage**: Ports `9000` and `9001` bind to `127.0.0.1:9000` / `127.0.0.1:9001`.

---

## 2. Beta Access Control (Whitelisting)

During testing phases, access to the application can be restricted using a whitelist check.

### 2.1 Activation

Set `APP_BETA_MODE=true` in the server environment.

### 2.2 Middleware Enforcement

- The authentication middleware (`src/libs/next/proxy/define-config.ts`) intercepts requests to protected routes (routes not listed in `isPublicRoute` such as `/signin`, `/signup`, `/auth-error`, or `/beta-access`).
- The middleware extracts the user's login email (`session.user.email`) and corporate email (`session.user.enterpriseEmail`).
- It compares both emails against the whitelists provided in `ADMIN_EMAILS` and `BETA_WHITE_LIST_EMAILS` (comma-separated lists, evaluated case-insensitively).
- If neither email is present on the whitelist, the user is redirected to the `/beta-access` access-denied page (preserving the `hl` language search parameter).

### 2.3 Automatic User Role Assignment

When a user authenticates for the the first time or is synced via `UserService.initUser` (`src/server/services/user/index.ts`), the system assigns them a database role:

- **Admin Role**: Assigned if the user's email matches the `ADMIN_EMAILS` whitelist.
- **Alpha Role**: Assigned if the user's email matches the `ALPHA_WHITE_LIST_EMAILS` whitelist.
- **Beta Role**: Assigned if the user's email matches the `BETA_WHITE_LIST_EMAILS` whitelist.
- **User Role**: The default role assigned to any other user.

The assigned role is persisted in the database via `userModel.updateUser({ role })`. The Lark silent login route (`src/app/api/auth/lark-silent/route.ts`) registers both the `email` and `enterprise_email` fields during profile synchronization to ensure whitelist checks succeed.

---

## 3. Feature Flag Evaluation System

Feature flags are configured in `src/config/featureFlags/schema.ts` to toggle application capabilities dynamically.

### 3.1 Alpha Feature Flags (Whitelisted Restrictions)

Some features are flagged as "Alpha" and are evaluated using the `evaluateAlphaFeatureFlag` helper. These are only enabled if the user's email matches the `ALPHA_WHITE_LIST_EMAILS` or `ADMIN_EMAILS` whitelists:

- **`enableLarkDoc`** (`enable_lark_doc`): Enables Lark document retrieval tools.
- **`enableLarkMessage`** (`enable_lark_message`): Enables Lark messaging tools.
- **`enableMentionEmployee`** (`enable_mention_employee`): Allows mentioning/tagging colleagues in chat inputs.
- **`enableMentionDoc`** (`enable_mention_doc`): Allows referencing Lark documents in chat inputs.
- **`showUploadLark`** (`show_upload_lark`): Renders the "Upload from Lark" UI action button.
- **Lark Search Filters**: Lark search UI filters (sorting, owner, chat, wiki, document formats).

### 3.2 Default Jemmia Feature Flags

Key default configurations defined in `DEFAULT_FEATURE_FLAGS`:

- **`enable_command_palette: false`**: Disables the global command menu palette (Cmd+K / Ctrl+K) to prevent hotkey conflicts.
- **`enable_topic_context_menu: false`**: Disables the right-click context menu on sidebar conversations.
- **`auth_sso_lark: true`**: Enables Lark SSO OAuth sign-in.
- **`knowledge_base: true`**: Enables RAG knowledge base.
- **`enable_tools: true`**: Enables agent plugins and web search tools.
- **`enable_model: true`**: Enables the model selector in the UI.
- **`enable_message_feedback: true`**: Enables the 👍/👎 chat message rating buttons.
