# Observability & Monitoring

This document describes how Brainy integrates Sentry to capture system exceptions, filter telemetry noise, and gather user feedback in production.

---

## 1. Context-Aware Initialization

To reduce performance overhead and console pollution in local environments, Sentry is restricted:

- **Production Only**: Sentry is only enabled when running in production mode with a configured DSN (`process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN`).
- **Server-Side Setup**: During startup, `src/instrumentation.ts` checks the `SENTRY_DSN` and dynamically imports either `sentry.server.config.ts` (for Node.js runtime) or `sentry.edge.config.ts` (for Edge runtime).
- **Client-Side Setup**: Sentry is automatically initialized for App Router pages. For the SPA entry point, `SentryProvider` (`src/layout/GlobalProvider/SentryProvider.tsx`) imports and initializes the client SDK at runtime using the `sentryDsn` property provided by the server environment (`window.__SERVER_CONFIG__.clientEnv.sentryDsn`).

---

## 2. Sentry Tunneling (Bypassing Ad-Blockers)

To prevent client-side ad-blockers from blocking Sentry event payloads, Brainy tunnels telemetry requests through Next.js:

- **Tunnel Endpoint**: All browser Sentry events are routed through the `/monitoring-tunnel` proxy endpoint.
- **Server Proxying**: The API route `src/app/monitoring-tunnel/route.ts` (POST) intercepts the envelope payloads.
  1. The server reads its own `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` variables.
  2. It extracts the Sentry project ID and ingestion host from the DSN.
  3. It proxies the raw binary payload to Sentry's ingest endpoint (`https://${host}/api/${project}/envelope/`) using the `application/x-sentry-envelope` content-type header.
  4. The server logs the forwarded payload size to `console.info` for monitoring purposes.

---

## 3. Telemetry Noise Filtering

To avoid dashboard clutter, the system filters out non-critical exceptions and developer warnings.

### 3.1 Global Exclusions (`ignoreErrors`)

The following message patterns are ignored across the client, server, and edge runtimes:

- `【H5-JS-SDK】`: Debug logs and warnings from the Lark H5 SDK.
- `cannot find pc bridge`: Harmless warnings from the Lark client when run in a standard web browser.
- `hydration-mismatch`: React reconciliation warnings due to minor differences between server-rendered and client-rendered HTML.
- `Active sessions list not found in secondary storage`: Redis warnings indicating that a session key was not present in the secondary cache.
- `[DEP0169]`: Node.js deprecation warning regarding the use of `url.parse()`.

### 3.2 Dynamic Event Filtering (`beforeSend`)

The `beforeSend` handlers in `sentry.server.config.ts` and `sentry.edge.config.ts` filter out the following events:

- **Better Auth Redirects**: Custom `APIError` events with a status of `FOUND` or a `statusCode` of `302`. These are normal page redirection behaviors.
- **Aborted HTTP Requests**: Connection resets with the message `aborted` and code `ECONNRESET`. These typically occur when a user closes their browser window during the Lark OAuth callback flow.

---

## 4. Console Interception

The system intercepts `console.error` calls to capture runtime exceptions automatically, reducing the need for manual `Sentry.captureException` calls:

- **Node.js (Server)**:
  - `console.error` is hijacked on startup.
  - If the arguments include an instance of `Error`, the exception is logged to Sentry using `Sentry.captureException()`. Non-error arguments are attached to the Sentry scope under `extra.consoleArgs`.
  - If no `Error` object is present, the arguments are concatenated into a string and logged as a message using `Sentry.captureMessage(..., 'error')`.
- **Client (Browser)**:
  - The client config (`sentry.client.config.ts`) similarly intercepts `console.error`.
  - The interceptor checks for noisy patterns (Lark warnings, hydration mismatches, Better Auth 302 redirects) and ignores them before reporting to Sentry.

---

## 5. User Feedback Systems

Brainy provides two channels for collecting user feedback:

### 5.1 Global Feedback Widget

Configured in `sentry.client.config.ts` and initialized in `SentryProvider.tsx`:

- Displays a persistent feedback button in the bottom-right corner of the interface.
- Uses the localized `feedback.widget.*` translations to render a Vietnamese interface.
- Allows users to submit text feedback and attach screenshots directly to Sentry.

### 5.2 Message-Level Chat Ratings

Users can rate AI agent responses directly in the chat interface (`AssistantActionsBar` in `src/features/Conversation/Messages/Assistant/Actions/index.tsx`):

- **UI**: Renders thumbs-up 👍 and thumbs-down 👎 icons next to chat bubble action buttons.
- **Mechanism**:
  1. Clicking a thumb icon triggers the `submitFeedback` callback in the `useSentryFeedback` hook (`src/hooks/useSentryFeedback.ts`).
  2. The hook extracts the user's Lark profile (Name and Email) from the Zustan store.
  3. It formats a description containing the message content (`content`), message ID (`messageId`), and topic ID (`topicId`).
  4. It logs the feedback to Sentry using `Sentry.captureFeedback()`.
  5. The sentiment rating (`positive` or `negative`), message ID, and topic ID are attached as tags to the Sentry event scope to allow for filtering.
  6. The message metadata is updated in the database to toggle the active state of the thumb icons.
