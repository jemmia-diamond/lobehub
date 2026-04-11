import { type LobeChatDatabase } from '@lobechat/database';
import { v4 as uuidv4 } from 'uuid';

import { ChunkModel } from '@/database/models/chunk';
import { EmbeddingModel } from '@/database/models/embedding';
import { ContentChunk } from '@/server/modules/ContentChunk';
import { ServerEmbeddingService } from '@/server/services/embedding';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * RagService
 *
 * Orchestrates the synchronous RAG pipeline (Chunking + Embedding)
 * Used by KnowledgeBootstrapService and FileUploadService for immediate ingestion.
 */
export class RagService {
  private userId: string;
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  /**
   * Process full indexing for a content source
   */
  async processIndexing(params: {
    content: Buffer;
    fileId: string;
    filename: string;
    fileType: string;
    skipExist?: boolean;
  }) {
    const { fileId, filename, content, fileType, skipExist } = params;
    const chunkModel = new ChunkModel(this.db, this.userId);

    // 1. Skip check if embeddings already exist
    if (skipExist) {
      const count = await chunkModel.countEmbeddingsByFileId(fileId);
      if (count > 0) {
        console.info(
          `[RagService] Skipping indexing as embeddings already exist for: ${filename} (${fileId})`,
        );
        return;
      }
    }

    console.info(`[RagService] Starting indexing for ${filename} (${fileId})...`);

    // 2. Chunking
    const chunker = new ContentChunk();
    const { chunks: chunkItems } = await chunker.chunkContent({
      content: new Uint8Array(content),
      filename,
      fileType,
    });

    if (chunkItems.length === 0) {
      console.warn(`[RagService] No chunks generated for ${filename}`);
      return;
    }

    // 3. Save Chunks
    const savedChunks = await chunkModel.bulkCreate(
      chunkItems.map((item) => ({
        ...item,
        id: uuidv4(),
        userId: this.userId,
      })),
      fileId,
    );

    // 4. Embedding with Batching & Backoff
    const embeddingDbModel = new EmbeddingModel(this.db, this.userId);
    const BATCH_SIZE = 5;

    for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
      const batch = savedChunks.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(savedChunks.length / BATCH_SIZE);

      const embeddings = await this.embedWithBackoff(
        batch.map((c) => c.text ?? ''),
        batchIndex,
        totalBatches,
      );

      if (!embeddings || embeddings.length === 0) continue;

      await embeddingDbModel.bulkCreate(
        batch.map((chunkItem, index) => ({
          chunkId: chunkItem.id,
          embeddings: embeddings[index],
        })),
      );

      // Proactive throttle between batches to stay under TPM quota
      if (i + BATCH_SIZE < savedChunks.length) {
        await sleep(500);
      }
    }

    console.info(`[RagService] Indexing completed for ${filename}`);
  }

  /**
   * Wraps ServerEmbeddingService.generateEmbeddings with exponential backoff
   * to gracefully handle 429 Rate Limit errors (e.g. from Gemini).
   */
  private async embedWithBackoff(
    texts: string[],
    batchIndex: number,
    totalBatches: number,
    maxRetries = 5,
  ): Promise<number[][] | null> {
    const BASE_DELAY_MS = 10_000; // 10s base — quota window is per-minute

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await ServerEmbeddingService.generateEmbeddings(texts, this.db, this.userId);
        return result;
      } catch (error: any) {
        const is429 =
          error?.statusCode === 429 ||
          error?.message?.includes('429') ||
          error?.message?.toLowerCase().includes('quota exceeded') ||
          error?.message?.toLowerCase().includes('resource_exhausted') ||
          error?.message?.toLowerCase().includes('rate limit');

        if (!is429 || attempt === maxRetries) {
          console.error(
            `[RagService] Embedding failed (batch ${batchIndex}/${totalBatches}, attempt ${attempt}):`,
            error?.message ?? error,
          );
          return null;
        }

        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 10s, 20s, 40s, 80s, 160s
        console.warn(
          `[RagService] Rate limited (429) on batch ${batchIndex}/${totalBatches}. ` +
            `Retrying in ${delay / 1000}s... (attempt ${attempt}/${maxRetries})`,
        );
        await sleep(delay);
      }
    }

    return null;
  }
}
