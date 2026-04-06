/**
 * Executes a Promise-returning operation and automatically catches Quota/Rate Limit
 * exceptions to wait and retry before ultimately throwing an error.
 *
 * @param operation The closure returning the Promise to execute
 * @param maxRetries Maximum number of total attempts (default 5)
 * @param logPrefix Optional prefix for console logs
 */
export async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  logPrefix: string = '[RateLimitRetry]',
): Promise<T> {
  let retries = maxRetries;

  while (retries > 0) {
    try {
      return await operation();
    } catch (error: any) {
      const isRateLimit =
        error?.errorType === 'QuotaLimitReached' ||
        error?.status === 429 ||
        String(error).includes('429');

      if (isRateLimit && retries > 1) {
        retries--;
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
          `${logPrefix} Rate limit hit. Waiting ${waitSeconds}s before retrying... (${retries} retries left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Retries exhausted without returning a result');
}
