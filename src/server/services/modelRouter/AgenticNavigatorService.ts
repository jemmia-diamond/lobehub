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
  /**
   * Skims through a large pool of chunks using a fast model to identify relevant pieces.
   * Based on OpenAI's Model Selection/Navigator cookbook.
   */
  public static async navigateChunks(params: {
    chunks: any[];
    models: { EXPERT: string; FAST: string; THINKING: string };
    modelRuntime: ModelRuntime;
    query: string;
  }): Promise<NavigatedContext> {
    const { query, chunks, modelRuntime, models } = params;

    try {
      log(`Skimming ${chunks.length} chunks for query: "${query}" using ${models.FAST}`);

      const result = await modelRuntime.generateObject({
        messages: [
          { content: agenticSkimmerSystemPrompt(query), role: 'system' },
          { content: agenticSkimmerUserPrompt(chunks), role: 'user' },
        ],
        model: models.FAST,
        schema: {
          name: 'agentic_skimmer',
          schema: {
            properties: {
              modelId: {
                description: 'The selected model ID for the final synthesis',
                enum: [models.THINKING, models.EXPERT],
                type: 'string',
              },
              relevantChunkIds: {
                description: 'List of IDs of chunks deemed relevant',
                items: { type: 'string' },
                type: 'array',
              },
              scratchpad: {
                description: 'Step-by-step reasoning for the selection',
                type: 'string',
              },
            },
            required: ['scratchpad', 'relevantChunkIds', 'modelId'],
            type: 'object',
          },
        },
      });

      if (result && typeof result === 'object') {
        const navigated = result as any;
        log(
          `Navigator finished on ${models.FAST}. Selected ${navigated.relevantChunkIds.length} chunks.`,
        );

        return {
          modelId: navigated.modelId,
          reasoning: navigated.scratchpad,
          relevantChunkIds: navigated.relevantChunkIds,
        };
      }
    } catch (error) {
      console.error('[Agentic Navigator] Skimming failed:', error);
    }

    // Fallback: return all chunks if skimming fails
    return {
      modelId: models.THINKING,
      reasoning: 'Navigation failed, falling back to all chunks.',
      relevantChunkIds: chunks.map((c, i) => (c.id || i).toString()),
    };
  }
}
