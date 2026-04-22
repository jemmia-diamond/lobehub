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

        if (!is429) throw error;

        lastError = error;
        if (attempt < maxRetriesPerKey) {
          console.warn(`${logPrefix} Key ${index + 1}/${keys.length} attempt ${attempt}/${maxRetriesPerKey} hit 429, retrying...`);
        } else {
          console.warn(`${logPrefix} Key ${index + 1}/${keys.length} exhausted after ${maxRetriesPerKey} attempts, trying next key...`);
        }
      }
    }
  }

  throw lastError;
};
