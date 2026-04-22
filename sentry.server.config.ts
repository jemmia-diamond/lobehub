import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 10% of traces sampled in production — adjust up if you need more detail
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Send logs (console.error etc.) to Sentry
  enableLogs: true,

  // Do NOT send PII — chat messages contain sensitive employee data
  sendDefaultPii: false,

  // Only enable when DSN is explicitly set
  enabled: !!process.env.SENTRY_DSN,

  // Ignore noisy non-actionable errors
  ignoreErrors: [
    // Better Auth OAuth redirects — these are expected 302s, not errors
    'APIError',
    // Network errors from client disconnects
    'ECONNRESET',
    'EPIPE',
    // Rate limit errors — handled by retry logic
    'QuotaLimitReached',
  ],
});
