import fs from 'node:fs';
import path from 'node:path';

import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { ChunkModel } from '@/database/models/chunk';
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
import { RagService } from '@/server/services/rag';

export const JEMMORA_ADMIN_ID = 'user_jemmora_admin';
export const JEMMORA_KB_NAME = 'Jemmia Diamond Knowledge';

/**
 * KnowledgeBootstrapService
 *
 * Automatically scans packages/knowledge-seed/ at startup,
 * creates RAG indices for Markdown, PDF, and DOCX files, and links them to the Default Agent.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class KnowledgeBootstrapService {
  private userId: string = '';
  private currentUserId?: string;

  private static globalInProgress = false;
  private static globalKbId: string | undefined = undefined;

  static get isKbReady(): boolean {
    return !!KnowledgeBootstrapService.globalKbId;
  }

  static get globalKnowledgeBaseId(): string | undefined {
    return KnowledgeBootstrapService.globalKbId;
  }

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

      // 3. Scan and Ingest Seed Files — sync additions, updates, and deletions
      const seedFiles = fs
        .readdirSync(seedDir)
        .filter((f) => f.endsWith('.md') || f.endsWith('.pdf') || f.endsWith('.docx'));

      // Remove DB files that no longer exist on disk
      // Only touch files owned by the admin and sourced from this seed directory
      const existingFiles = await db.query.files.findMany({
        where: and(eq(files.userId, JEMMORA_ADMIN_ID)),
      });
      const seedFileUrls = new Set(seedFiles.map((f) => `local://jemmia-diamond/${f}`));
      const seedFilenames = new Set(seedFiles);
      console.info(`[KnowledgeBootstrap] Checking ${existingFiles.length} DB files for deletion. Disk has ${seedFiles.length} files.`);
      for (const dbFile of existingFiles) {
        if (!dbFile.url?.startsWith('local://')) continue;

        const isNewFormat = dbFile.url.startsWith('local://jemmia-diamond/');
        const isOldFormat = !isNewFormat;

        const shouldDelete = isNewFormat
          ? !seedFileUrls.has(dbFile.url)
          : !seedFilenames.has(dbFile.name);

        if (shouldDelete) {
          console.info(`[KnowledgeBootstrap] Removing deleted file: ${dbFile.name} (${dbFile.url})`);
          await db.delete(files).where(eq(files.id, dbFile.id));
        } else if (isOldFormat) {
          console.info(`[KnowledgeBootstrap] Legacy URL: ${dbFile.name} — still on disk, skipping`);
        }
      }

      for (const filename of seedFiles) {
        await this.syncSeedFile(db, path.join(seedDir, filename), kbId);
        await sleep(500);
      }

      console.info(`[KnowledgeBootstrap] Global Knowledge ready (KB ID: ${kbId})`);
      KnowledgeBootstrapService.globalKbId = kbId;
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

    console.info(`[KnowledgeBootstrap] Linked user ${userId} to Global Knowledge (Inbox).`);
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
    if (!existingPlugins.includes('lobe-knowledge-base')) {
      console.info(`[KnowledgeBootstrap] Enabling lobe-knowledge-base tool for Inbox agent...`);
      await db
        .update(agents)
        .set({ plugins: [...existingPlugins, 'lobe-knowledge-base'] })
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

  private async syncSeedFile(db: any, filePath: string, kbId: string): Promise<string | undefined> {
    const filename = path.basename(filePath);
    const fileType = this.getMimeType(filename);
    const content = fs.readFileSync(filePath);
    const fileHash = this.generateHash(content);

    const fileUrl = `local://jemmia-diamond/${filename}`;

    // Use fileHash as the primary key — content-addressable, source-agnostic
    const existingByHash = await db.query.files.findFirst({
      where: eq(files.fileHash, fileHash),
    });

    if (existingByHash) {
      const chunkModel = new ChunkModel(db, this.userId);
      const count = await chunkModel.countEmbeddingsByFileId(existingByHash.id);
      if (count > 0) {
        // Same content — but check if the filename/URL changed (rename)
        if (existingByHash.url !== fileUrl || existingByHash.name !== filename) {
          console.info(`[KnowledgeBootstrap] File renamed: ${existingByHash.name} → ${filename}. Updating record.`);
          await db.update(files).set({ name: filename, url: fileUrl }).where(eq(files.id, existingByHash.id));
        } else {
          console.info(
            `[KnowledgeBootstrap] Skipped (already indexed with ${count} embeddings): ${filename}`,
          );
        }
        return existingByHash.id;
      }
      console.warn(
        `[KnowledgeBootstrap] File ${filename} exists but has no embeddings. Re-indexing...`,
      );
      await db.delete(files).where(eq(files.id, existingByHash.id));
    } else {
      // Check if a previous version (different hash) existed — indicates an update
      const previousVersion = await db.query.files.findFirst({
        where: and(eq(files.url, fileUrl), eq(files.userId, this.userId)),
      });
      if (previousVersion) {
        console.info(`[KnowledgeBootstrap] File updated, removing old version: ${filename}`);
        await db.delete(files).where(eq(files.id, previousVersion.id));
      }
    }

    // 0. Ensure Global File record exists (Foreign Key constraint)
    const existingGlobal = await db.query.globalFiles.findFirst({
      where: eq(globalFiles.hashId, fileHash),
    });

    if (!existingGlobal) {
      await db.insert(globalFiles).values({
        creator: this.userId,
        fileType,
        hashId: fileHash,
        size: content.length,
        url: fileUrl,
      });
    }

    console.info(`[KnowledgeBootstrap] Indexing new file: ${filename}...`);

    // 1. Create File Record
    const fileId = uuidv4();
    await db.insert(files).values({
      fileHash,
      fileType,
      id: fileId,
      name: filename,
      size: content.length,
      url: fileUrl,
      userId: this.userId,
    });

    // 2. Link to Knowledge Base
    await db.insert(knowledgeBaseFiles).values({
      fileId,
      knowledgeBaseId: kbId,
      userId: this.userId,
    });

    // 3. Process RAG (Chunking + Embedding) using shared RagService
    try {
      const ragService = new RagService(db, this.userId);
      await ragService.processIndexing({
        content,
        fileId,
        fileType,
        filename,
        skipExist: true, // For seed files, we always want to avoid re-indexing if already present
      });
      return fileId;
    } catch (error) {
      console.error(`[KnowledgeBootstrap] RAG processing failed for ${filename}:`, error);
      return undefined;
    }
  }

  private generateHash(content: Buffer): string {
    const crypto = require('node:crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf': {
        return 'application/pdf';
      }
      case '.docx': {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      default: {
        return 'text/markdown';
      }
    }
  }
}
