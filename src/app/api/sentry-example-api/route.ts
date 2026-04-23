import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // Test server-side console.error interceptor
  console.error('[SentryTest] Server console.error interceptor test', new Error('server console.error interceptor'));

  throw new Error('Sentry Example API Route Error');
  return NextResponse.json({ data: 'Testing Sentry Error...' });
}
