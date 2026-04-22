import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DEFAULT_FILE_EMBEDDING_MODEL_ITEM } from '@lobechat/const';
import { RequestTrigger } from '@lobechat/types';
import { embed, embedMany } from 'ai';

import { type LobeChatDatabase } from '@/database/type';
import { knowledgeEnv } from '@/envs/knowledge';
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';
import { withGoogleEmbeddingKeyFallback } from '@/server/utils/googleEmbeddingKeys';
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

  private static async embedWithSdkFallback(
    operation: (provider: ReturnType<typeof createGoogleGenerativeAI>) => Promise<any>,
    logPrefix: string,
    maxRetries: number = 3,
  ) {
    return withGoogleEmbeddingKeyFallback(
      (apiKey) =>
        withRateLimitRetry(
          () => operation(createGoogleGenerativeAI({ apiKey })),
          maxRetries,
          logPrefix,
        ),
      logPrefix,
    );
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
            maxRetries: 0, // disable SDK retries — withRateLimitRetry handles per-minute 429s
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
            maxRetries: 0, // disable SDK retries — withRateLimitRetry handles per-minute 429s
            model: provider.embedding(model),
            providerOptions: {
              google: { outputDimensionality: VECTOR_DIMENSIONS },
            },
            values: texts,
          }),
        logPrefix,
        3,
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
