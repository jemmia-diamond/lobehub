'use client';

import { memo, type PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

/**
 * Ensures Sentry is initialized in the SPA context.
 * sentry.client.config.ts runs for App Router pages automatically.
 * For the SPA entry point, we need to trigger initialization here.
 * The feedbackIntegration widget is configured in sentry.client.config.ts.
 */
const SentryProvider = memo<PropsWithChildren>(({ children }) => {
  const { t } = useTranslation('common');

  const user = useUserStore(userProfileSelectors.userProfile);

  useEffect(() => {
    const serverConfig = (window as any).__SERVER_CONFIG__;
    const sentryDsn = serverConfig?.clientEnv?.sentryDsn || process.env.NEXT_PUBLIC_SENTRY_DSN;
    const sentryEnv =
      serverConfig?.clientEnv?.sentryEnvironment ||
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV;

    if (!sentryDsn) return;

    import('@sentry/nextjs').then((Sentry) => {
      const client = Sentry.getClient();

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
            triggerLabel: t('feedback.widget.buttonLabel'),
            cancelButtonLabel: t('feedback.widget.cancelButtonLabel'),
            colorScheme: 'light',
            enableScreenshot: true,
            formTitle: t('feedback.widget.formTitle'),
            messageLabel: t('feedback.widget.messageLabel'),
            messagePlaceholder: t('feedback.widget.messagePlaceholder'),
            addScreenshotButtonLabel: t('feedback.widget.addScreenshotButtonLabel'),
            removeScreenshotButtonLabel: t('feedback.widget.removeScreenshotButtonLabel'),
            submitButtonLabel: t('feedback.widget.submitButtonLabel'),
            successMessageText: t('feedback.widget.successMessage'),
            showEmail: false,
            showName: false,
          }),
        ],
        tracesSampleRate: 0.1,
        tunnel: '/monitoring-tunnel',
      });
    });
  }, [t]);

  useEffect(() => {
    if (!user) return;

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser({
        email: user.email || undefined,
        username: user.fullName || user.username || undefined,
      });
    });
  }, [user]);

  return <>{children}</>;
});

SentryProvider.displayName = 'SentryProvider';

export default SentryProvider;
