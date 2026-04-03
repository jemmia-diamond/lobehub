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
  users,
} from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { ContentChunk } from '@/server/modules/ContentChunk';
import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';

export const JEMMORA_ADMIN_ID = 'user_jemmora_admin';
export const JEMMORA_KB_NAME = 'Jemmia Diamond Knowledge';

/**
 * KnowledgeBootstrapService
 *
 * Automatically scans packages/knowledge-seed/ at startup,
 * creates RAG indices for Markdown files, and links them to the Default Agent.
 */
export class KnowledgeBootstrapService {
  private userId: string = '';
  private currentUserId?: string;

  private static globalInProgress = false;
  private static globalKbId: string | undefined = undefined;

  constructor(userId?: string) {
    this.currentUserId = userId;
  }

  /**
   * Global bootstrap - Ensures the master knowledge base is indexed
   * This should be called once on server startup.
   */
  async bootstrapOnce() {
    if (KnowledgeBootstrapService.globalKbId) return KnowledgeBootstrapService.globalKbId;
    if (KnowledgeBootstrapService.globalInProgress) return;

    KnowledgeBootstrapService.globalInProgress = true;

    try {
      const db = await getServerDB();

      // 1. Ensure System Admin user exists
      await this.ensureAdminUser(db);
      this.userId = JEMMORA_ADMIN_ID;

      console.info(`[KnowledgeBootstrap] Starting Global Knowledge Indexing...`);

      const seedDir = path.join(process.cwd(), 'packages/knowledge-seed/jemmia-diamond');
      if (!fs.existsSync(seedDir)) {
        console.warn(`[KnowledgeBootstrap] Seed directory not found: ${seedDir}`);
        return;
      }

      // 2. Ensure Jemmia Knowledge Base exists (Global copy)
      const kbId = await this.ensureKnowledgeBase(db, true);
      KnowledgeBootstrapService.globalKbId = kbId;

      // 3. Scan and Ingest Markdown Files
      const mdFiles = fs.readdirSync(seedDir).filter((f) => f.endsWith('.md'));
      for (const filename of mdFiles) {
        await this.syncMarkdownFile(db, path.join(seedDir, filename), kbId);
      }

      console.info(`[KnowledgeBootstrap] Global Knowledge ready (KB ID: ${kbId})`);
      return kbId;
    } catch (error) {
      console.error('[KnowledgeBootstrap] Global bootstrap failed:', error);
    } finally {
      KnowledgeBootstrapService.globalInProgress = false;
    }
  }

  /**
   * User-specific bootstrap - Only handles linking the user to the global knowledge
   */
  async bootstrap(targetUserId?: string) {
    const userId = targetUserId || this.currentUserId;
    if (!userId) return;

    this.userId = userId;

    // Ensure global indexing has at least tried to run
    const globalKbId = await this.bootstrapOnce();
    if (!globalKbId) {
      console.warn('[KnowledgeBootstrap] Global KB not ready. Skipping link for user:', userId);
      return;
    }

    const db = await getServerDB();

    // Link this specific user's Inbox Agent to the Global KB
    await this.linkKnowledgeToInbox(db, globalKbId);

    console.info(`[KnowledgeBootstrap] Linked user ${userId} to Global Knowledge.`);
  }

  private async ensureAdminUser(db: any) {
    const admin = await db.query.users.findFirst({
      where: eq(users.id, JEMMORA_ADMIN_ID),
    });

    if (!admin) {
      console.info(`[KnowledgeBootstrap] Creating System Admin user (${JEMMORA_ADMIN_ID})...`);
      await db.insert(users).values({
        id: JEMMORA_ADMIN_ID,
        email: 'admin@jemmia.vn',
        username: 'Jemmia Admin',
      });
    }
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

    // 4. Ensure the knowledge-base tool is enabled in agent's plugins
    const existingPlugins = (inboxAgent.plugins as string[]) || [];
    if (!existingPlugins.includes('knowledge-base')) {
      console.info(`[KnowledgeBootstrap] Enabling knowledge-base tool for Inbox agent...`);
      await db
        .update(agents)
        .set({ plugins: [...existingPlugins, 'knowledge-base'] })
        .where(eq(agents.id, inboxAgent.id));
    }
  }

  private async ensureKnowledgeBase(db: any, isPublic: boolean = false): Promise<string> {
    const existing = await db.query.knowledgeBases.findFirst({
      where: eq(knowledgeBases.name, JEMMORA_KB_NAME),
    });

    if (existing) return existing.id;

    const id = uuidv4();
    await db.insert(knowledgeBases).values({
      id,
      isPublic,
      name: JEMMORA_KB_NAME,
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
