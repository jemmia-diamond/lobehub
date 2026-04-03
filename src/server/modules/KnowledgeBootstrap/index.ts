import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_PROVIDER } from '@lobechat/business-const';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { ChunkModel } from '@/database/models/chunk';
import { EmbeddingModel } from '@/database/models/embedding';
import {
  agents,
  agentsKnowledgeBases,
  files,
  globalFiles,
  knowledgeBaseFiles,
  knowledgeBases,
} from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { ContentChunk } from '@/server/modules/ContentChunk';
import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';

/**
 * KnowledgeBootstrapService
 *
 * Automatically scans packages/knowledge-seed/ at startup,
 * creates RAG indices for Markdown files, and links them to the Default Agent.
 */
export class KnowledgeBootstrapService {
  private userId: string = '';
  private currentUserId?: string;

  constructor(userId?: string) {
    this.currentUserId = userId;
  }

  /**
   * Main bootstrap entry point
   */
  async bootstrap(targetUserId?: string) {
    const db = await getServerDB();
    const userId = targetUserId || this.currentUserId;

    // 0. Ensure we have a valid User ID (Foreign Key constraint)
    if (userId) {
      this.userId = userId;
    } else {
      const firstUser = await db.query.users.findFirst();
      if (!firstUser) {
        console.warn('[KnowledgeBootstrap] No users found in database. Skipping bootstrap.');
        return;
      }
      this.userId = firstUser.id;
    }

    console.info(`[KnowledgeBootstrap] Starting knowledge seed scan for user: ${this.userId}...`);

    const seedDir = path.join(process.cwd(), 'packages/knowledge-seed/jemmia-diamond');
    if (!fs.existsSync(seedDir)) {
      console.warn(`[KnowledgeBootstrap] Seed directory not found: ${seedDir}`);
      return;
    }

    // 1. Ensure Jemmia Knowledge Base exists
    const kbId = await this.ensureKnowledgeBase(db);

    // 2. Link to Inbox Agent (the default assistant)
    await this.linkKnowledgeToInbox(db, kbId);

    // 3. Scan and Ingest Markdown Files
    const mdFiles = fs.readdirSync(seedDir).filter((f) => f.endsWith('.md'));
    const newlyIngestedFileIds: string[] = [];

    for (const filename of mdFiles) {
      const fileId = await this.syncMarkdownFile(db, path.join(seedDir, filename), kbId);
      if (fileId) {
        newlyIngestedFileIds.push(fileId);
      }
    }

    console.info(
      `[KnowledgeBootstrap] Knowledge seed sync completed. Ingested ${newlyIngestedFileIds.length} files.`,
    );
  }

  private async linkKnowledgeToInbox(db: any, kbId: string) {
    // 1. Find the Inbox agent for THIS user
    const inboxAgent = await db.query.agents.findFirst({
      where: and(eq(agents.slug, 'inbox'), eq(agents.userId, this.userId)),
    });

    if (!inboxAgent) {
      console.warn(
        `[KnowledgeBootstrap] Inbox agent not found for user ${this.userId}. Skipping linkage.`,
      );
      return;
    }

    // 2. Check if already linked
    const existingLink = await db.query.agentsKnowledgeBases.findFirst({
      where: and(
        eq(agentsKnowledgeBases.agentId, inboxAgent.id),
        eq(agentsKnowledgeBases.knowledgeBaseId, kbId),
      ),
    });

    if (existingLink) {
      // Enforce the 'Enabled' state every time the bootstrap runs
      if (!existingLink.enabled) {
        console.info(`[KnowledgeBootstrap] Re-enabling knowledge base for Inbox agent...`);
        await db
          .update(agentsKnowledgeBases)
          .set({ enabled: true })
          .where(
            and(
              eq(agentsKnowledgeBases.agentId, inboxAgent.id),
              eq(agentsKnowledgeBases.knowledgeBaseId, kbId),
            ),
          );
      }
      return;
    }

    // 3. Create the link
    console.info(
      `[KnowledgeBootstrap] Linking knowledge base to Inbox agent (${inboxAgent.id})...`,
    );
    await db.insert(agentsKnowledgeBases).values({
      agentId: inboxAgent.id,
      enabled: true,
      knowledgeBaseId: kbId,
      userId: this.userId,
    });
  }

  private async ensureKnowledgeBase(db: any): Promise<string> {
    const existing = await db.query.knowledgeBases.findFirst({
      where: eq(knowledgeBases.name, 'Jemmia Diamond Knowledge'),
    });

    if (existing) return existing.id;

    const id = uuidv4();
    await db.insert(knowledgeBases).values({
      id,
      name: 'Jemmia Diamond Knowledge',
      userId: this.userId,
    });

    return id;
  }

  private async syncMarkdownFile(
    db: any,
    filePath: string,
    kbId: string,
  ): Promise<string | undefined> {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath);
    const fileHash = this.generateHash(content);

    // Check if file already exists with this hash
    const existing = await db.query.files.findFirst({
      where: eq(files.fileHash, fileHash),
    });

    if (existing) {
      // Check if it has chunks. If not, the previous run likely failed halfway.
      const chunkModel = new ChunkModel(db, this.userId);
      const count = await chunkModel.countByFileId(existing.id);

      if (count > 0) {
        console.info(
          `[KnowledgeBootstrap] Skipped (already indexed with ${count} chunks): ${filename}`,
        );
        return existing.id;
      }

      console.warn(
        `[KnowledgeBootstrap] File ${filename} exists but has no chunks. Re-indexing...`,
      );
      // Delete the stale record to allow clean re-insertion
      await db.delete(files).where(eq(files.id, existing.id));
    }

    // 0. Ensure Global File record exists (Foreign Key constraint)
    const existingGlobal = await db.query.globalFiles.findFirst({
      where: eq(globalFiles.hashId, fileHash),
    });

    if (!existingGlobal) {
      await db.insert(globalFiles).values({
        creator: this.userId,
        fileType: 'text/markdown',
        hashId: fileHash,
        size: content.length,
        url: `local://${filename}`, // Placeholder for internal seed files
      });
    }

    console.info(`[KnowledgeBootstrap] Indexing new file: ${filename}...`);

    // 1. Create File Record
    const fileId = uuidv4();
    await db.insert(files).values({
      fileHash,
      fileType: 'text/markdown',
      id: fileId,
      name: filename,
      size: content.length,
      url: `local://${filename}`,
      userId: this.userId,
    });

    // 2. Link to Knowledge Base
    await db.insert(knowledgeBaseFiles).values({
      fileId,
      knowledgeBaseId: kbId,
      userId: this.userId,
    });

    // 3. Process RAG (Chunking + Embedding)
    try {
      await this.processRAG(db, fileId, filename, content);
      return fileId;
    } catch (error) {
      console.error(`[KnowledgeBootstrap] RAG processing failed for ${filename}:`, error);
      return undefined;
    }
  }

  private async processRAG(db: any, fileId: string, filename: string, content: Buffer) {
    // A. Chunking
    const chunker = new ContentChunk();
    const { chunks: chunkItems } = await chunker.chunkContent({
      content: new Uint8Array(content),
      filename,
      fileType: 'text/markdown',
    });

    if (chunkItems.length === 0) return;

    // B. Save Chunks
    const chunkModel = new ChunkModel(db, this.userId);
    const savedChunks = await chunkModel.bulkCreate(
      chunkItems.map((item) => ({
        ...item,
        id: uuidv4(),
        userId: this.userId,
      })),
      fileId,
    );

    // C. Embedding
    const { model, provider } = getServerDefaultFilesConfig().embeddingModel || {
      model: 'text-embedding-3-small',
      provider: DEFAULT_PROVIDER,
    };

    console.info(`[KnowledgeBootstrap] Generating embeddings using ${provider}:${model}...`);
    const runtime = initModelRuntimeWithUserPayload(provider, {} as any);
    const embeddingModel = new EmbeddingModel(db, this.userId);

    // Process chunks in batches for efficiency
    const BATCH_SIZE = 10;
    for (let i = 0; i < savedChunks.length; i += BATCH_SIZE) {
      const batch = savedChunks.slice(i, i + BATCH_SIZE);

      const vectors = await runtime.embeddings({
        input: batch.map((c) => c.text ?? ''),
        model,
      });

      if (!vectors) continue;

      await embeddingModel.bulkCreate(
        batch.map((chunkItem, index) => ({
          chunkId: chunkItem.id,
          embeddings: vectors[index],
        })),
      );
    }
  }

  private generateHash(content: Buffer): string {
    const crypto = require('node:crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
