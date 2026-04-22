import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 10% of traces sampled in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Send logs to Sentry
  enableLogs: true,

  // Do NOT send PII — chat messages contain sensitive employee data
  sendDefaultPii: false,

  // Only enable when DSN is explicitly set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
