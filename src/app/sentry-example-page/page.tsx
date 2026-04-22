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

  return (
    <main style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Sentry Test Page</h1>
      <p>Use these buttons to test Sentry error reporting.</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={throwError}
          style={{ padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Throw Frontend Error
        </button>

        <button
          onClick={captureError}
          style={{ padding: '8px 16px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Capture Error Manually
        </button>

        <a
          href="/api/sentry-example-api"
          style={{ padding: '8px 16px', background: '#38a169', color: 'white', borderRadius: 4, textDecoration: 'none', display: 'inline-block' }}
        >
          Trigger API Error
        </a>
      </div>

      {hasSentError && (
        <p style={{ marginTop: 16, color: '#38a169' }}>
          ✓ Error captured — check your Sentry dashboard.
        </p>
      )}
    </main>
  );
}
