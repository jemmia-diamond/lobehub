import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // Route browser Sentry requests through Next.js to avoid ad blockers
  tunnel: '/monitoring-tunnel',

  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: false,

  // Enable whenever DSN is set — works in both dev and production
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    // Persistent feedback widget — bottom-right corner
    Sentry.feedbackIntegration({
      colorScheme: 'light',
      triggerLabel: 'Phản hồi',
      formTitle: 'Gửi phản hồi',
      submitButtonLabel: 'Gửi',
      cancelButtonLabel: 'Hủy',
      nameLabel: 'Tên',
      namePlaceholder: 'Tên của bạn',
      emailLabel: 'Email',
      emailPlaceholder: 'email@jemmia.vn',
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
    const message = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');

    // Filter out noisy warnings that aren't actual errors
    const isNoise =
      message.includes('【H5-JS-SDK】') ||
      message.includes('cannot find pc bridge') ||
      message.includes('hydration-mismatch') ||
      message.includes('APIError: FOUND') ||
      message.includes('"status":"FOUND"') ||
      message.includes('"statusCode":302');

    if (isNoise) return;

    originalConsoleError(...args);
    const error = args.find((a) => a instanceof Error) as Error | undefined;
    if (error) {
      Sentry.captureException(error, {
        extra: { consoleArgs: args.filter((a) => !(a instanceof Error)) },
      });
    } else if (args.length > 0) {
      Sentry.captureMessage(message, 'error');
    }
  };
}
