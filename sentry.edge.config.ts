import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 10% of traces sampled in production and development — adjust up if you need more detail
  tracesSampleRate: 0.1,

  // Send logs (console.error etc.) to Sentry
  enableLogs: true,

  // Do NOT send PII — chat messages contain sensitive employee data
  sendDefaultPii: false,

  // Only enable in production (or when DSN is explicitly set)
  enabled: !!process.env.SENTRY_DSN,
});
