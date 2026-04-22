/**
 * Sentry utilities for manual error capture.
 * Use these instead of console.error for errors you want tracked.
 */
import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with optional context.
 * No-op when Sentry is not initialized (DSN not set).
 */
export const captureException = (
  error: unknown,
  context?: Record<string, unknown>,
): void => {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.captureException(error, context ? { extra: context } : undefined);
};

/**
 * Capture a message (non-exception) at a given severity level.
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error',
): void => {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
};
