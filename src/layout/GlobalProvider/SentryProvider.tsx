'use client';

import { memo, type PropsWithChildren, useEffect } from 'react';

/**
 * Ensures Sentry is initialized in the SPA context.
 * sentry.client.config.ts runs for App Router pages automatically.
 * For the SPA entry point, we need to trigger initialization here.
 * The feedbackIntegration widget is configured in sentry.client.config.ts.
 */
const SentryProvider = memo<PropsWithChildren>(({ children }) => {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

    // sentry.client.config.ts should have already run and initialized Sentry.
    // If not (e.g. pure SPA context), initialize it now.
    import('@sentry/nextjs').then((Sentry) => {
      if (Sentry.getClient()) return; // already initialized by sentry.client.config.ts

      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        tunnel: '/monitoring-tunnel',
        tracesSampleRate: 0.1,
        enableLogs: true,
        enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
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
