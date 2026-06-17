# Lark Suite Integration

This document outlines how Brainy connects, authenticates, and synchronizes data with the Lark (Feishu) corporate workspace platform.

---

## 1. SSO & Silent Login

- **Single Sign-On (SSO)**: Better Auth is configured with a custom OAuth provider for Lark at `src/libs/better-auth/sso/providers/lark.ts`. The client credentials are loaded from the `AUTH_LARK_APP_ID` and `AUTH_LARK_APP_SECRET` environment variables.
- **Silent Login**: When users open Brainy inside the embedded Lark WebView, `useLarkSilentLogin.ts` triggers an automated silent OAuth login. The client exchanges an authorization code with `/api/auth/lark-silent/route.ts` (POST) to initialize the session. The endpoint automatically records both the regular `email` and the corporate `enterprise_email` of the employee.

---

## 2. Lark Token Lifecycle Management

Lark APIs require a valid User Access Token. The token lifecycle is managed in `src/server/services/larkAuth.ts`:

- **Token Retrieval**: The helper `getLarkUserAccessToken()` queries the database user account records. If the access token is close to expiring (less than 5 minutes of validity remaining), the system calls `refreshLarkUserAccessToken()` to request a new token via the Lark OAuth endpoint `/open-apis/authen/v2/oauth/token`.
- **Invalidation**: The wrapper `withLarkUserAccessToken()` handles Lark API requests. If a request returns a `401 Unauthorized` or token revocation error, the system clears the token from the database, prompting the user to re-authenticate.

---

## 3. Lark User Profile Fetching (`fetchLarkUserProfile`)

The system retrieves user profile details during session initialization in `src/server/routers/lambda/user.ts`:

1. The backend retrieves an internal Lark `tenant_access_token`.
2. It queries the Lark Contacts API: `https://open.larksuite.com/open-apis/contact/v3/users/${accountId}`.
   - **Name**: Resolved from `name` or `en_name`.
   - **Email**: Resolved from `enterprise_email` or `email`.
   - **Job Title**: Priority is given to the custom attribute `'C-7260397964497453087'` (a custom field used by Jemmia HR), falling back to the standard `job_title` field.
3. It resolves the department name by querying `https://open.larksuite.com/open-apis/contact/v3/departments/${deptId}`.
4. It recursively queries parent department IDs (`parent_department_id`) to find the top-level corporate division, which is assigned as the user's `unit`.

This user profile (Name, Job Title, Department, Unit) is injected into the default Inbox Agent's system prompt under the `## USER PROFILE` section.

---

## 4. Lark Doc & Wiki TRPC Routers

The backend provides a TRPC router `larkDocRouter` that connects directly to the `@lobechat/builtin-tool-lark-doc` SDK, enabling the AI to search and read Lark documents:

- **`getDocContent`**: Retrieves the detailed text content of a Lark Document using `documentId`.
- **`getDocMeta`**: Retrieves the metadata of a document.
- **`searchDocs`**: Performs text searches on documents, supporting pagination via `offset` and `count`, and filtering by `docsTypes`.
- **`searchWiki`**: Searches wiki spaces, supporting pagination via `pageToken` and filtering by `spaceId`.
- **`listWikiSpaces`**: Lists all Wiki spaces the user has permission to access.
- **`listWikiNodes`**: Retrieves wiki nodes under a specific `spaceId`, supporting pagination via `pageToken` and `pageSize`.
