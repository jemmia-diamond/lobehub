import { type ModelRuntime, safeParseJSON } from '@lobechat/model-runtime';
import { agenticSkimmerSystemPrompt, agenticSkimmerUserPrompt } from '@lobechat/prompts';
import debug from 'debug';

import { withRateLimitRetry } from '@/utils/retryPolicy';

import type { AgenticChunk, NavigatedContext } from './types';

const log = debug('lobechat:agentic-navigator');

export class AgenticNavigatorService {
  private static readonly MAX_DEPTH = 2;
  private static readonly MAX_CHUNK_LENGTH = 2400;
  private static readonly CHUNK_OVERLAP = 200;

  /**
   * Navigates through chunks using a hierarchical "drill-down" approach.
   * Based on the standard hierarchical 'Expert Document Navigator' pattern for long-context RAG.
   */
  public static async navigateChunks(params: {
    chunks: AgenticChunk[];
    modelRuntime: ModelRuntime;
    models: { EXPERT: string; FAST: string; THINKING: string };
    query: string;
  }): Promise<NavigatedContext> {
    const { query, chunks, modelRuntime, models } = params;

    try {
      console.info(
        `[Agentic Navigator] Starting hierarchical navigation for ${chunks.length} chunks. Query: "${query.slice(0, 50)}..."`,
      );

      return await this.navigateRecursive({
        chunks,
        depth: 0,
        modelRuntime,
        models,
        query,
        scratchpad: '',
      });
    } catch (error) {
      console.error('[Agentic Navigator] Exploration failed:', error);
    }

    // Fallback: return all chunks if hierarchical navigation fails
    return {
      modelId: models.FAST,
      reasoning: 'Navigation failed, falling back to all chunks with workhorse tier.',
      relevantChunkIds: chunks.map((c, i) => (c.id || i).toString()),
    };
  }

  /**
   * Internal recursive helper to refine chunk selection.
   */
  private static async navigateRecursive(params: {
    chunks: AgenticChunk[];
    depth: number;
    modelRuntime: ModelRuntime;
    models: { EXPERT: string; FAST: string; THINKING: string };
    query: string;
    scratchpad: string;
  }): Promise<NavigatedContext> {
    const { query, chunks, modelRuntime, models, depth, scratchpad } = params;
    const chunksForPrompt = this.prepareChunksForNavigation(chunks, depth);

    console.info(
      `[Agentic Navigator] Depth ${depth}: Evaluating ${chunksForPrompt.length} chunks...`,
    );

    const result = await withRateLimitRetry(
      () =>
        modelRuntime.generateObject({
          messages: [
            { content: agenticSkimmerSystemPrompt(query), role: 'system' },
            {
              content: `${scratchpad ? `REASONING SO FAR:\n${scratchpad}\n\n` : ''}${agenticSkimmerUserPrompt(
                chunksForPrompt.map((c) => ({ ...c, content: c.content?.slice(0, 10000) })),
              )}`,
              role: 'user',
            },
          ],
          model: models.FAST,
          schema: {
            name: 'agentic_skimmer',
            schema: {
              properties: {
                modelId: {
                  description:
                    'Selected model tier for final synthesis. Use FAST for standard workhorse tasks, THINKING for high-quality RAG answers, and EXPERT for complex analysis.',
                  enum: [models.FAST, models.THINKING, models.EXPERT],
                  type: 'string',
                },
                relevantChunkIds: {
                  description:
                    'The IDs of the context chunks required to answer the query accurately.',
                  items: { type: 'string' },
                  type: 'array',
                },
                scratchpad: {
                  description: 'Step-by-step reasoning for chunk selection and model tier choice.',
                  type: 'string',
                },
              },
              required: ['scratchpad', 'relevantChunkIds', 'modelId'],
              type: 'object',
            },
          },
        }),
      3,
      '[Navigator Skimmer]',
    );

    // Use defensive JSON extraction to handle potential LLM conversational filler
    const parsed = safeParseJSON<{
      modelId: string;
      relevantChunkIds: string[];
      scratchpad: string;
    }>(result);

    if (!parsed) {
      throw new Error('Invalid navigator response: Could not parse JSON block');
    }

    const { relevantChunkIds, scratchpad: newScratchpad, modelId } = parsed;
    const selectedChunks = chunksForPrompt.filter((c) => relevantChunkIds.includes(c.id));
    const normalizedChunkIds = Array.from(
      new Set(selectedChunks.map((chunk) => chunk.parentId ?? chunk.id)),
    );

    console.info(
      `[Agentic Navigator] Depth ${depth}: LLM selected ${selectedChunks.length} chunks (mapped to ${normalizedChunkIds.length} original chunks). Next tier: ${modelId}. Reasoning: ${newScratchpad.slice(0, 100)}...`,
    );

    log(`[Navigator Depth ${depth}] Selected ${selectedChunks.length} chunks.`);

    // Recursion stop condition: reached max depth or selection is sufficiently small
    if (depth >= this.MAX_DEPTH || selectedChunks.length <= 5) {
      return {
        modelId,
        reasoning: newScratchpad,
        relevantChunkIds: normalizedChunkIds,
      };
    }

    return this.navigateRecursive({
      chunks: selectedChunks,
      depth: depth + 1,
      modelRuntime,
      models,
      query,
      scratchpad: newScratchpad,
    });
  }

  private static prepareChunksForNavigation(chunks: AgenticChunk[], depth: number): AgenticChunk[] {
    if (depth >= this.MAX_DEPTH || chunks.length <= 8) {
      return chunks;
    }

    return chunks.flatMap((chunk) => {
      const segments = this.splitTextIntoChunks(
        chunk.content,
        this.MAX_CHUNK_LENGTH,
        this.CHUNK_OVERLAP,
      );
      if (segments.length <= 1) {
        return chunk;
      }

      return segments.map((segment, index) => ({
        ...chunk,
        id: `${chunk.id}-${depth}-${index}`,
        parentId: chunk.parentId || chunk.id,
        content: segment,
      }));
    });
  }

  private static splitTextIntoChunks(text: string, maxSize: number, overlap: number): string[] {
    const normalizedText = text.trim();
    if (normalizedText.length <= maxSize) return [normalizedText];

    const chunks: string[] = [];
    let start = 0;

    while (start < normalizedText.length) {
      let end = Math.min(start + maxSize, normalizedText.length);
      if (end < normalizedText.length) {
        const boundary = Math.max(
          normalizedText.lastIndexOf('\n', end),
          normalizedText.lastIndexOf(' ', end),
        );
        if (boundary > start) {
          end = boundary;
        }
      }

      chunks.push(normalizedText.slice(start, end).trim());
      start = Math.max(end - overlap, end);
    }

    return chunks;
  }
}
