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

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN,
  ignoreErrors: [
    '【H5-JS-SDK】',
    'cannot find pc bridge',
    'hydration-mismatch',
    'Active sessions list not found in secondary storage',
  ],
  beforeSend(event, hint) {
    const error = hint.originalException as any;
    // Better Auth uses APIError with status 'FOUND' and statusCode 302 for standard Next.js redirects
    if (error?.name === 'APIError' && (error?.status === 'FOUND' || error?.statusCode === 302)) {
      return null;
    }

    // Ignore harmless aborted HTTP requests (e.g. when a user closes the browser during Lark OAuth callback)
    if (error?.message === 'aborted' && error?.code === 'ECONNRESET') {
      return null;
    }
    return event;
  },
});
