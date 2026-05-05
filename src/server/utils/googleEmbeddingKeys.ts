/**
 * Returns Google API keys for embedding in priority order.
 * Reads from GOOGLE_EMBEDDING_API_KEYS (comma-separated).
 */
export const getGoogleEmbeddingKeys = (): string[] => {
  const combined = process.env.GOOGLE_EMBEDDING_API_KEYS;
  if (combined) {
    return combined
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Runs an embedding operation with sequential key fallback on 429.
 * Each key is retried up to maxRetriesPerKey times before moving to the next key.
 */
export const withGoogleEmbeddingKeyFallback = async <T>(
  operation: (apiKey: string) => Promise<T>,
  logPrefix = '[GoogleEmbedding]',
  maxRetriesPerKey = 3,
): Promise<T> => {
  const keys = getGoogleEmbeddingKeys();
  let lastError: any;

  for (const [index, apiKey] of keys.entries()) {
    for (let attempt = 1; attempt <= maxRetriesPerKey; attempt++) {
      try {
        return await operation(apiKey);
      } catch (error: any) {
        // Unwrap AI SDK RetryError to get the actual cause
        const cause = error?.cause ?? error?.lastError ?? error;
        const is429 =
          cause?.statusCode === 429 ||
          error?.status === 429 ||
          String(error).includes('429') ||
          error?.errorType === 'QuotaLimitReached' ||
          String(cause).includes('429');

        const isAuthError =
          cause?.statusCode === 403 ||
          cause?.statusCode === 401 ||
          error?.status === 403 ||
          error?.status === 401 ||
          String(error).toLowerCase().includes('denied access') ||
          String(error).toLowerCase().includes('forbidden') ||
          String(error).toLowerCase().includes('unauthorized') ||
          error?.message?.toLowerCase().includes('permission_denied');

        if (!is429 && !isAuthError) throw error;

        lastError = error;
        const errorType = is429 ? 'rate limit (429)' : 'auth error (401/403)';
        if (attempt < maxRetriesPerKey) {
          console.error(
            `${logPrefix} Key ${index + 1}/${keys.length} attempt ${attempt}/${maxRetriesPerKey} hit ${errorType}, retrying...`,
          );
        } else {
          console.error(
            `${logPrefix} Key ${index + 1}/${keys.length} exhausted after ${maxRetriesPerKey} attempts, trying next key...`,
          );
        }
      }
    }
  }

  if (keys.length === 0) {
    throw new Error(`${logPrefix} No Google API keys found in environment variables.`);
  }

  throw lastError || new Error(`${logPrefix} Embedding failed with unknown error.`);
};
