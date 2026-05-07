/**
 * Returns Google API keys for embedding in priority order.
 * Reads from GOOGLE_EMBEDDING_API_KEYS (comma-separated).
 */
export const getGoogleEmbeddingKeys = (): string[] => {
  const combined = process.env.GOOGLE_EMBEDDING_API_KEYS;
  if (!combined) return [];
  return combined
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
};

/**
 * Runs an embedding operation with sequential key fallback.
 *
 * Retry behavior:
 * - 403/401 (auth error): skip to next key immediately, no retries on same key
 * - 429 (rate limit): retry up to maxRetriesPerKey times on same key, then move to next
 * - Other errors: throw immediately
 *
 * Sentry/console.error: only on final failure after all keys exhausted.
 * Intermediate retries use console.warn only.
 */
export const withGoogleEmbeddingKeyFallback = async <T>(
  operation: (apiKey: string) => Promise<T>,
  logPrefix = '[GoogleEmbedding]',
  maxRetriesPerKey = 3,
): Promise<T> => {
  const keys = getGoogleEmbeddingKeys();

  if (keys.length === 0) {
    throw new Error(`${logPrefix} No Google API keys found in GOOGLE_EMBEDDING_API_KEYS.`);
  }

  let lastError: unknown;

  for (const [index, apiKey] of keys.entries()) {
    const isLastKey = index === keys.length - 1;
    let attempts = 0;

    while (attempts < maxRetriesPerKey) {
      attempts++;
      try {
        return await operation(apiKey);
      } catch (error: any) {
        lastError = error;

        // Unwrap AI SDK RetryError
        const cause = error?.cause ?? error?.lastError ?? error;

        const is429 =
          cause?.statusCode === 429 ||
          error?.status === 429 ||
          String(error).includes('429') ||
          error?.errorType === 'QuotaLimitReached' ||
          String(cause).includes('429');

        const is403 =
          cause?.statusCode === 403 ||
          cause?.statusCode === 401 ||
          error?.status === 403 ||
          error?.status === 401 ||
          String(error).toLowerCase().includes('denied access') ||
          String(error).toLowerCase().includes('forbidden') ||
          String(error).toLowerCase().includes('unauthorized') ||
          error?.message?.toLowerCase().includes('permission_denied');

        // Non-retryable error — throw immediately
        if (!is429 && !is403) throw error;

        const errorLabel = is403 ? '403/auth' : '429/rate-limit';
        const isFinalFailure = isLastKey && (is403 || attempts >= maxRetriesPerKey);

        if (is403) {
          // Auth errors: skip to next key immediately, no retries
          if (isFinalFailure) {
            // All keys exhausted — log as error (will be picked up by Sentry)
            console.error(`${logPrefix} Key ${index + 1}/${keys.length} hit ${errorLabel}. All keys exhausted.`);
          } else {
            console.warn(`${logPrefix} Key ${index + 1}/${keys.length} hit ${errorLabel}. Trying next key...`);
          }
          break; // exit inner while, move to next key
        }

        // 429: retry on same key with smart backoff
        if (attempts < maxRetriesPerKey) {
          let waitSeconds = 5;
          try {
            if (error?.error?.message && typeof error.error.message === 'string') {
              const parsed = JSON.parse(error.error.message);
              const retryInfo = parsed?.error?.details?.find(
                (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo',
              );
              if (retryInfo?.retryDelay) {
                waitSeconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10) + 1;
              } else {
                const match = parsed?.error?.message?.match(/retry in ([\d.]+)s/);
                if (match && match[1]) {
                  waitSeconds = Math.ceil(parseFloat(match[1])) + 1;
                }
              }
            }
          } catch {
            // Ignore parse error, use default 5s
          }

          console.warn(
            `${logPrefix} Key ${index + 1}/${keys.length} attempt ${attempts}/${maxRetriesPerKey} hit ${errorLabel}. Waiting ${waitSeconds}s before retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        } else if (isFinalFailure) {
          // Last attempt on last key — log as error (Sentry)
          console.error(
            `${logPrefix} Key ${index + 1}/${keys.length} exhausted after ${maxRetriesPerKey} attempts. All keys exhausted.`,
          );
        } else {
          // Last attempt on this key, but more keys remain
          console.warn(
            `${logPrefix} Key ${index + 1}/${keys.length} exhausted after ${maxRetriesPerKey} attempts. Trying next key...`,
          );
        }
      }
    }
  }

  throw lastError ?? new Error(`${logPrefix} Embedding failed with unknown error.`);
};
