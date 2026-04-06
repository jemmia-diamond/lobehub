export async function register() {
  // In local development, write debug logs to logs/server.log
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./libs/debug-file-logger');
  }

  // Auto-start GatewayManager and KnowledgeBootstrap for non-Vercel environments so that
  // persistent bots reconnect and global knowledge base is indexed natively at server restart.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    !process.env.VERCEL_ENV &&
    process.env.DATABASE_URL
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
