'use client';

import { memo, type PropsWithChildren, useEffect } from 'react';

/**
 * Initializes Sentry feedback widget in the SPA context.
 * instrumentation-client.ts only runs in App Router pages,
 * not in the SPA entry point — so we init the widget here.
 */
const SentryProvider = memo<PropsWithChildren>(({ children }) => {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

    // Dynamically import to avoid SSR issues
    import('@sentry/nextjs').then((Sentry) => {
      // Check if already initialized (instrumentation-client.ts may have run on App Router pages)
      const client = Sentry.getClient();
      if (client) return; // already initialized

      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

        // Route browser Sentry requests through Next.js to avoid ad blockers
        tunnel: '/monitoring-tunnel',

        enableLogs: true,
        sendDefaultPii: false,
        enabled: true,
        integrations: [
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
    });
  }, []);

  return <>{children}</>;
});

SentryProvider.displayName = 'SentryProvider';

export default SentryProvider;
