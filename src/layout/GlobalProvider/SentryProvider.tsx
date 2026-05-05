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
    const serverConfig = (window as any).__SERVER_CONFIG__;
    const sentryDsn =
      serverConfig?.clientEnv?.sentryDsn || process.env.NEXT_PUBLIC_SENTRY_DSN;
    const sentryEnv =
      serverConfig?.clientEnv?.sentryEnvironment ||
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV;

    if (!sentryDsn) return;

    // sentry.client.config.ts should have already run and initialized Sentry for Next.js pages.
    // For the SPA entry point, we need to ensure it's initialized with the runtime DSN.
    import('@sentry/nextjs').then((Sentry) => {
      const client = Sentry.getClient();

      // If already initialized with the correct DSN, skip.
      // In SPA context, if it was initialized by sentry.client.config.ts with a build-time DSN
      // that is different from our runtime DSN, we might want to re-initialize.
      if (client && client.getDsn()?.toString() === sentryDsn) return;

      Sentry.init({
        dsn: sentryDsn,
        environment: sentryEnv,
        tunnel: '/monitoring-tunnel',
        tracesSampleRate: 0.1,
        enableLogs: true,
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
