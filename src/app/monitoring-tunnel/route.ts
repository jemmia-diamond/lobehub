import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Manual Sentry tunnel route handler.
 * Proxies Sentry envelopes to the Sentry ingest endpoint to bypass ad-blockers.
 * Ref: https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers
 */
export async function POST(req: Request) {
  try {
    // Check both runtime and build-time variables
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    
    if (!dsn) {
      console.error('[SentryTunnel] Sentry DSN not configured on server');
      return new NextResponse('Sentry DSN not configured', { status: 500 });
    }

    // Extract project ID and host from DSN
    // Format: https://key@host/project
    const url = new URL(dsn);
    const host = url.hostname;
    
    // Handle cases where there might be a trailing slash
    const project = url.pathname.replace(/\/$/, '').split('/').pop();

    if (!host || !project) {
      console.error('[SentryTunnel] Invalid Sentry DSN:', dsn);
      return new NextResponse('Invalid Sentry DSN', { status: 500 });
    }

    const envelope = await req.text();
    const sentryIngestUrl = `https://${host}/api/${project}/envelope/`;

    console.info(`[SentryTunnel] Proxying envelope to: ${sentryIngestUrl}`);

    const response = await fetch(sentryIngestUrl, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[SentryTunnel] Sentry ingestion failed (${response.status}):`, responseText);
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[SentryTunnel] Error proxying to Sentry:', error);
    
    // Provide a slightly more descriptive error in the 500 response for debugging
    return new NextResponse(`Internal Server Error: ${error?.message || 'Unknown error'}`, { 
      status: 500 
    });
  }
}
