import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DEFAULT_FILE_EMBEDDING_MODEL_ITEM } from '@lobechat/const';
import { RequestTrigger } from '@lobechat/types';
import { embed, embedMany } from 'ai';

import { type LobeChatDatabase } from '@/database/type';
import { knowledgeEnv } from '@/envs/knowledge';
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';
import { withRateLimitRetry } from '@/utils/retryPolicy';

/**
 * The vector dimension used by the pgvector column in the database.
 * Google's gemini-embedding-2-preview defaults to 3072 dimensions,
 * but we request exactly this size via `outputDimensionality` so the
 * model itself optimizes the representation — no post-hoc truncation needed.
 */
const VECTOR_DIMENSIONS = 3072;

export class ServerEmbeddingService {
  /**
   * Determine whether to use direct AI SDK or fallback to initModelRuntime (aiproxy).
   * By default, we use 'sdk' unless USE_EMBEDDING_PROXY=1 is explicitly set.
   */
  private static getMode(): 'sdk' | 'proxy' {
    return knowledgeEnv.USE_EMBEDDING_PROXY ? 'proxy' : 'sdk';
  }

  private static getGoogleProvider() {
    return createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  private static getGoogleBackupProvider() {
    return createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY_BACKUP,
    });
  }

  private static async embedWithSdkFallback(
    operation: (provider: ReturnType<typeof createGoogleGenerativeAI>) => Promise<any>,
    logPrefix: string,
    maxRetries: number = 3,
  ) {
    try {
      return await withRateLimitRetry(() => operation(this.getGoogleProvider()), maxRetries, logPrefix);
    } catch (primaryError: any) {
      const isRateLimit =
        primaryError?.status === 429 ||
        String(primaryError).includes('429') ||
        primaryError?.errorType === 'QuotaLimitReached';

      if (isRateLimit && process.env.GOOGLE_API_KEY_BACKUP) {
        console.warn(`${logPrefix} Primary key exhausted, switching to backup key`);
        return await withRateLimitRetry(
          () => operation(this.getGoogleBackupProvider()),
          maxRetries,
          `${logPrefix}[backup]`,
        );
      }
      throw primaryError;
    }
  }

  static async generateEmbedding(
    text: string,
    db: LobeChatDatabase,
    userId: string,
    logPrefix = '[SemanticSearch]',
  ): Promise<number[]> {
    const { model, provider } =
      getServerDefaultFilesConfig().embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;

    if (this.getMode() === 'sdk') {
      const result = await this.embedWithSdkFallback(
        (provider) =>
          embed({
            model: provider.embedding(model),
            providerOptions: {
              google: { outputDimensionality: VECTOR_DIMENSIONS },
            },
            value: text,
          }),
        logPrefix,
        3,
      );
      return result.embedding;
    }

    const agentRuntime = await initModelRuntimeFromDB(db, userId, provider);
    const embeddings = await withRateLimitRetry(
      () =>
        agentRuntime.embeddings(
          {
            dimensions: VECTOR_DIMENSIONS,
            input: text,
            model,
          },
          { metadata: { trigger: RequestTrigger.SemanticSearch }, user: userId },
        ),
      3,
      logPrefix,
    );

    if (!embeddings || embeddings.length === 0) {
      throw new Error(`Embedding model ${model} returned no results`);
    }

    return embeddings[0];
  }

  static async generateEmbeddings(
    texts: string[],
    db: LobeChatDatabase,
    userId: string,
    logPrefix = '[KnowledgeBootstrap]',
  ): Promise<number[][]> {
    const { model, provider } =
      getServerDefaultFilesConfig().embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;

    if (this.getMode() === 'sdk') {
      const result = await this.embedWithSdkFallback(
        (provider) =>
          embedMany({
            model: provider.embedding(model),
            providerOptions: {
              google: { outputDimensionality: VECTOR_DIMENSIONS },
            },
            values: texts,
          }),
        logPrefix,
        5,
      );
      return result.embeddings;
    }

    const agentRuntime = await initModelRuntimeFromDB(db, userId, provider);
    const embeddings = await withRateLimitRetry(
      () =>
        agentRuntime.embeddings(
          {
            dimensions: VECTOR_DIMENSIONS,
            input: texts,
            model,
          },
          { metadata: { trigger: RequestTrigger.FileEmbedding }, user: userId },
        ),
      5,
      logPrefix,
    );

    if (!embeddings || embeddings.length === 0) {
      throw new Error(`Embedding model ${model} returned no results`);
    }

    return embeddings;
  }
}
