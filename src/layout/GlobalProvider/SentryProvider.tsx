'use client';

import { memo, type PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Ensures Sentry is initialized in the SPA context.
 * sentry.client.config.ts runs for App Router pages automatically.
 * For the SPA entry point, we need to trigger initialization here.
 * The feedbackIntegration widget is configured in sentry.client.config.ts.
 */
const SentryProvider = memo<PropsWithChildren>(({ children }) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    const serverConfig = (window as any).__SERVER_CONFIG__;
    const sentryDsn = serverConfig?.clientEnv?.sentryDsn || process.env.NEXT_PUBLIC_SENTRY_DSN;
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
      if (client && client.getDsn()?.toString() === sentryDsn) return;

      Sentry.init({
        debug: __DEV__,
        dsn: sentryDsn,
        enableLogs: __DEV__,
        enabled: true,
        environment: sentryEnv,
        integrations: [
          Sentry.feedbackIntegration({
            buttonLabel: t('feedback.widget.buttonLabel'),
            cancelButtonLabel: t('feedback.widget.cancelButtonLabel'),
            colorScheme: 'light',
            emailLabel: t('feedback.widget.emailLabel'),
            emailPlaceholder: t('feedback.widget.emailPlaceholder'),
            enableScreenshot: true,
            formTitle: t('feedback.widget.formTitle'),
            isEmailRequired: false,
            isNameRequired: false,
            messageLabel: t('feedback.widget.messageLabel'),
            messagePlaceholder: t('feedback.widget.messagePlaceholder'),
            nameLabel: t('feedback.widget.nameLabel'),
            namePlaceholder: t('feedback.widget.namePlaceholder'),
            submitButtonLabel: t('feedback.widget.submitButtonLabel'),
            successMessageText: t('feedback.widget.successMessage'),
          }),
        ],
        tracesSampleRate: 0.1,
        tunnel: '/monitoring-tunnel',
      });
    });
  }, [t]);

  return <>{children}</>;
});

SentryProvider.displayName = 'SentryProvider';

export default SentryProvider;
