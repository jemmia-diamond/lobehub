import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Manual Sentry tunnel route handler.
 * Proxies Sentry envelopes to the Sentry ingest endpoint to bypass ad-blockers.
 * Ref: https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers
 */
export async function POST(req: Request) {
  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      return new NextResponse('Sentry DSN not configured', { status: 500 });
    }

    // Extract project ID and host from DSN
    // Format: https://key@host/project
    const url = new URL(dsn);
    const host = url.hostname;
    const project = url.pathname.split('/').pop();

    if (!host || !project) {
      return new NextResponse('Invalid Sentry DSN', { status: 500 });
    }

    const envelope = await req.text();
    const sentryIngestUrl = `https://${host}/api/${project}/envelope/`;

    const response = await fetch(sentryIngestUrl, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[SentryTunnel] Error proxying to Sentry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
