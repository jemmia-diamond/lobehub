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
const getDimension = (modelId: string): number => {
  if (modelId.includes('text-embedding-3-small')) return 1536;
  if (modelId.includes('gemini-embedding-001')) return 1024;
  if (modelId.includes('gemini-embedding-2-preview')) return 3072;
  return 1024; // Default fallback
};

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

  static async generateEmbedding(
    text: string,
    db: LobeChatDatabase,
    userId: string,
    logPrefix = '[SemanticSearch]',
  ): Promise<number[]> {
    const { model, provider } =
      getServerDefaultFilesConfig().embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;

    const dimensions = getDimension(model);
    console.info(
      `${logPrefix} Model: ${model} | Dimensions: ${dimensions} | Mode: ${this.getMode()}`,
    );

    if (this.getMode() === 'sdk') {
      const result = await withRateLimitRetry(
        () =>
          embed({
            model: this.getGoogleProvider().embedding(model),
            providerOptions: {
              google: { outputDimensionality: dimensions },
            },
            value: text,
          }),
        3,
        logPrefix,
      );
      return result.embedding;
    }

    const agentRuntime = await initModelRuntimeFromDB(db, userId, provider);
    const embeddings = await withRateLimitRetry(
      () =>
        agentRuntime.embeddings(
          {
            dimensions,
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

    const dimensions = getDimension(model);
    console.info(
      `${logPrefix} Model: ${model} | Dimensions: ${dimensions} | Mode: ${this.getMode()}`,
    );

    if (this.getMode() === 'sdk') {
      const result = await withRateLimitRetry(
        () =>
          embedMany({
            model: this.getGoogleProvider().embedding(model),
            providerOptions: {
              google: { outputDimensionality: dimensions },
            },
            values: texts,
          }),
        5,
        logPrefix,
      );
      return result.embeddings;
    }

    const agentRuntime = await initModelRuntimeFromDB(db, userId, provider);
    const embeddings = await withRateLimitRetry(
      () =>
        agentRuntime.embeddings(
          {
            dimensions,
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
