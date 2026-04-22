export async function register() {
  // Initialize Sentry for server-side error tracking
  if (process.env.SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config');
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config');
    }

    // Intercept console.error on the server to auto-capture to Sentry.
    // Covers all console.error() calls in server-side code without requiring
    // manual Sentry.captureException() in each location.
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      const Sentry = await import('@sentry/nextjs');
      const originalConsoleError = console.error.bind(console);
      console.error = (...args: unknown[]) => {
        originalConsoleError(...args);
        // Find the first Error object in args, or capture as a message
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
  }

  // In local development, write debug logs to logs/server.log
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./libs/debug-file-logger');
  }

  // Auto-start GatewayManager and KnowledgeBootstrap on server start for non-Vercel environments (Docker, local).
  // Persistent bots need reconnection after restart.
  // On Vercel, the cron job at /api/agent/gateway handles this reliably instead.
  // In local dev, opt-in via ENABLE_BOT_IN_DEV to avoid clobbering a shared bot binding.
  const isDev = process.env.NODE_ENV !== 'production';
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.DATABASE_URL &&
    !process.env.VERCEL_ENV &&
    (!isDev || process.env.ENABLE_BOT_IN_DEV === '1')
  ) {
    const { GatewayService } = await import('./server/services/gateway');
    const service = new GatewayService();
    service.ensureRunning().catch((err) => {
      console.error('[Instrumentation] Failed to auto-start GatewayManager:', err);
    });

    const { KnowledgeBootstrapService } = await import('./server/modules/KnowledgeBootstrap');
    const kbService = new KnowledgeBootstrapService();
    kbService.bootstrapOnce().catch((err) => {
      console.error('[Instrumentation] Failed to auto-start KnowledgeBootstrap:', err);
    });
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_TELEMETRY_IN_DEV) {
    return;
  }

  const shouldEnable = process.env.ENABLE_TELEMETRY && process.env.NEXT_RUNTIME === 'nodejs';
  if (!shouldEnable) {
    return;
  }

  await import('./instrumentation.node');
}
