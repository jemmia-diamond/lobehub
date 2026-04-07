import { type ModelRuntime } from '@lobechat/model-runtime';
import { agenticSkimmerSystemPrompt, agenticSkimmerUserPrompt } from '@lobechat/prompts';
import debug from 'debug';

const log = debug('lobechat:agentic-navigator');

export interface NavigatedContext {
  modelId: string;
  reasoning: string;
  relevantChunkIds: string[];
}

export class AgenticNavigatorService {
  private static readonly MAX_DEPTH = 2;

  /**
   * Navigates through chunks using a hierarchical "drill-down" approach.
   * Based on the standard hierarchical 'Expert Document Navigator' pattern for long-context RAG.
   */
  public static async navigateChunks(params: {
    chunks: any[];
    models: { EXPERT: string; FAST: string; THINKING: string };
    modelRuntime: ModelRuntime;
    query: string;
  }): Promise<NavigatedContext> {
    const { query, chunks, modelRuntime, models } = params;

    try {
      log(`Starting hierarchical navigation for ${chunks.length} chunks...`);

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
      modelId: models.THINKING,
      reasoning: 'Navigation failed, falling back to all chunks.',
      relevantChunkIds: chunks.map((c, i) => (c.id || i).toString()),
    };
  }

  /**
   * Internal recursive helper to refine chunk selection.
   */
  private static async navigateRecursive(params: {
    chunks: any[];
    depth: number;
    modelRuntime: ModelRuntime;
    models: { EXPERT: string; FAST: string; THINKING: string };
    query: string;
    scratchpad: string;
  }): Promise<NavigatedContext> {
    const { query, chunks, modelRuntime, models, depth, scratchpad } = params;

    log(`[Navigator Depth ${depth}] Evaluating ${chunks.length} chunks...`);

    const result = await modelRuntime.generateObject({
      messages: [
        { content: agenticSkimmerSystemPrompt(query), role: 'system' },
        {
          content: `${scratchpad ? `REASONING SO FAR:\n${scratchpad}\n\n` : ''}${agenticSkimmerUserPrompt(
            chunks.map((c) => ({ ...c, content: c.content?.slice(0, 10000) })),
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
                'Selected model tier for final synthesis. Use THINKING for standard retrieval-augmented answers and EXPERT for complex analysis.',
              enum: [models.THINKING, models.EXPERT],
              type: 'string',
            },
            relevantChunkIds: {
              description: 'The IDs of the context chunks required to answer the query accurately.',
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
    });

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid navigator response');
    }

    const { relevantChunkIds, scratchpad: newScratchpad, modelId } = result as any;
    const selectedChunks = chunks.filter((c) => relevantChunkIds.includes(c.id));

    log(`[Navigator Depth ${depth}] Selected ${selectedChunks.length} chunks.`);

    // Recursion stop condition: reached max depth or selection is sufficiently small
    if (depth >= this.MAX_DEPTH || selectedChunks.length <= 5) {
      return {
        modelId,
        reasoning: newScratchpad,
        relevantChunkIds,
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
}
