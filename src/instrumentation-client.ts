import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // Route browser Sentry requests through Next.js to avoid ad blockers
  tunnel: '/monitoring-tunnel',

  // 10% of traces sampled in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Send logs to Sentry
  enableLogs: true,

  // Do NOT send PII — chat messages contain sensitive employee data
  sendDefaultPii: false,

  // Only enable when DSN is explicitly set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    // Persistent feedback widget — bottom-right corner
    // Users can submit feedback anytime without needing an error
    Sentry.feedbackIntegration({
      colorScheme: 'light',
      triggerLabel: 'Phản hồi',
      formTitle: 'Gửi phản hồi',
      submitButtonLabel: 'Gửi',
      cancelButtonLabel: 'Hủy',
      nameLabel: 'Tên',
      namePlaceholder: 'Tên của bạn',
      emailLabel: 'Email',
      emailPlaceholder: 'tech@jemmia.vn',
      messageLabel: 'Mô tả',
      messagePlaceholder: 'Bạn gặp vấn đề gì? Brainy trả lời sai điều gì?',
      successMessageText: 'Cảm ơn bạn đã phản hồi!',
      isEmailRequired: false,
      isNameRequired: false,
      enableScreenshot: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Intercept client-side console.error to auto-capture to Sentry
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);
    const error = args.find((a) => a instanceof Error) as Error | undefined;
    if (error) {
      Sentry.captureException(error, {
        extra: { consoleArgs: args.filter((a) => !(a instanceof Error)) },
      });
    } else if (args.length > 0) {
      const message = args
        .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
        .join(' ');
      Sentry.captureMessage(message, 'error');
    }
  };
}
