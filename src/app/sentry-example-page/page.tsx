'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false);

  const throwError = () => {
    throw new Error('Sentry Example Frontend Error');
  };

  const captureError = () => {
    Sentry.captureException(new Error('Sentry Example Captured Error'));
    setHasSentError(true);
  };

  const triggerConsoleError = () => {
    console.error('Sentry console.error interceptor test', new Error('console.error interceptor'));
    setHasSentError(true);
  };

  const triggerConsoleErrorNoObject = () => {
    console.error('[SentryTest] Plain string console.error — no Error object');
    setHasSentError(true);
  };

  return (
    <main style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Sentry Test Page</h1>
      <p>Use these buttons to test Sentry error reporting.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24, maxWidth: 400 }}>
        <button
          onClick={throwError}
          style={{ padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          1. Throw Frontend Error (unhandled)
        </button>

        <button
          onClick={captureError}
          style={{ padding: '8px 16px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          2. Capture Error Manually (captureException)
        </button>

        <button
          onClick={triggerConsoleError}
          style={{ padding: '8px 16px', background: '#805ad5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          3. console.error with Error object (interceptor test)
        </button>

        <button
          onClick={triggerConsoleErrorNoObject}
          style={{ padding: '8px 16px', background: '#d69e2e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          4. console.error plain string (interceptor test)
        </button>

        <a
          href="/api/sentry-example-api"
          style={{ padding: '8px 16px', background: '#38a169', color: 'white', borderRadius: 4, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
        >
          5. Trigger Server-side API Error
        </a>
      </div>

      {hasSentError && (
        <p style={{ marginTop: 16, color: '#38a169' }}>
          ✓ Triggered — check your Sentry dashboard (Issues or User Feedback).
        </p>
      )}

      <div style={{ marginTop: 32, fontSize: 12, color: '#666' }}>
        <p><strong>Expected in Sentry:</strong></p>
        <ul>
          <li>Button 1 → captured by global-error.tsx boundary</li>
          <li>Button 2 → appears immediately as an issue</li>
          <li>Button 3 → captured by console.error interceptor (client-side)</li>
          <li>Button 4 → captured as a Sentry message (client-side)</li>
          <li>Button 5 → server-side error, captured by server interceptor</li>
        </ul>
      </div>
    </main>
  );
}
