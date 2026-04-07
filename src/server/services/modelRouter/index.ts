import { type ModelRuntime } from '@lobechat/model-runtime';
import { intelligentRoutingSystemPrompt, intelligentRoutingUserPrompt } from '@lobechat/prompts';
import debug from 'debug';

import { AgenticNavigatorService } from './AgenticNavigatorService';
import { AgenticVerifierService } from './AgenticVerifierService';

const log = debug('lobechat:model-router');

export const JEMMIA_MODELS = {
  EXPERT: 'gemini-2.5-pro',
  FAST: 'gemini-2.5-flash-lite',
  THINKING: 'gemini-2.5-flash',
};

export type JemmiaMode = 'auto' | 'fast' | 'thinking' | 'expert' | (string & {});

export interface ModelRoute {
  model: string;
  provider: string;
  reason?: string;
}

export class ModelRouterService {
  private static readonly JEMMIA_PROVIDER = 'jemmia';

  public static isJemmiaProvider(provider?: string): boolean {
    return provider === this.JEMMIA_PROVIDER;
  }

  public static isRoutingModeOrModel(input: string): boolean {
    const i = input.toLowerCase();
    return (
      i === 'auto' ||
      i === 'fast' ||
      i === 'thinking' ||
      i === 'expert' ||
      Object.values(JEMMIA_MODELS).includes(i)
    );
  }

  public static async evaluate(params: {
    messages: any[];
    modelRuntime: ModelRuntime;
    tools: any[];
  }): Promise<ModelRoute & { messages?: any[] }> {
    const { messages, tools, modelRuntime } = params;

    try {
      log('Evaluating intelligent routing...');

      // 1. Context Analysis: Check for RAG context in system prompt
      const systemMessage = messages.find((m) => m.role === 'system');
      const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';
      const containsChunks = systemContent.includes('<chunk') && systemContent.includes('</chunk>');

      // 2. Navigation Phase: If RAG chunks are present, perform hierarchical filtering
      if (containsChunks) {
        const chunks = this.extractChunks(systemContent);

        if (chunks.length > 0) {
          log('RAG Chunks detected. Triggering Agentic Navigator...');
          const userMessage = messages.findLast((m) => m.role === 'user');
          const query =
            typeof userMessage?.content === 'string' ? userMessage.content : 'unknown query';

          const navigation = await AgenticNavigatorService.navigateChunks({
            chunks,
            modelRuntime,
            models: JEMMIA_MODELS,
            query,
          });

          // Re-construct system prompt with narrowed context
          const filteredSystemContent = this.rebuildSystemPrompt(
            systemContent,
            chunks,
            navigation.relevantChunkIds,
          );
          const navigatedMessages = messages.map((m) =>
            m.role === 'system' ? { ...m, content: filteredSystemContent } : m,
          );

          return {
            messages: navigatedMessages,
            model: navigation.modelId,
            provider: this.JEMMIA_PROVIDER,
            reason: `agentic-navigation: ${navigation.relevantChunkIds.length}/${chunks.length} chunks`,
          };
        }
      }

      // 3. Triage Phase: General intent routing using the FAST tier model
      const result = await modelRuntime.generateObject({
        messages: [
          { content: intelligentRoutingSystemPrompt, role: 'system' },
          { content: intelligentRoutingUserPrompt(messages, tools), role: 'user' },
        ],
        model: JEMMIA_MODELS.FAST,
        schema: {
          name: 'intelligent_routing',
          schema: {
            properties: {
              modelId: {
                description: 'The selected model ID',
                enum: Object.values(JEMMIA_MODELS),
                type: 'string',
              },
              scratchpad: {
                description: 'Reasoning for the triage decision',
                type: 'string',
              },
            },
            required: ['modelId', 'scratchpad'],
            type: 'object',
          },
        },
      });

      let modelId: string | undefined;
      let scratchpad: string | undefined;

      // Handle structured output or regex fallback
      if (typeof result === 'object' && result !== null) {
        modelId = (result as any)?.modelId;
        scratchpad = (result as any)?.scratchpad;
      } else if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result);
          modelId = parsed?.modelId;
          scratchpad = parsed?.scratchpad;
        } catch {
          const modelIds = Object.values(JEMMIA_MODELS).join('|').replaceAll('.', '\\.');
          const match = result.match(new RegExp(`(${modelIds})`));
          if (match) modelId = match[0];
        }
      }

      if (modelId) {
        log(`[Router Triage] Reasoning: ${scratchpad || 'N/A'}`);
        log(`[Router Triage] Selected Model: ${modelId}`);
        return { model: modelId, provider: this.JEMMIA_PROVIDER, reason: 'intelligent-routing' };
      }
    } catch (error) {
      console.error('[Jemmora Routing] Evaluation failed, falling back to default:', error);
    }

    return {
      model: JEMMIA_MODELS.FAST,
      provider: this.JEMMIA_PROVIDER,
      reason: 'fallback-gemini-fast',
    };
  }

  /**
   * Triggers the verification phase for agentic responses.
   */
  public static async verify(params: {
    answer: string;
    chunks: any[];
    modelId: string;
    modelRuntime: ModelRuntime;
    query: string;
  }): Promise<any> {
    const { modelId, modelRuntime, ...rest } = params;

    // Skip verification for manually selected models or variants
    if (
      modelId === JEMMIA_MODELS.FAST ||
      modelId === JEMMIA_MODELS.THINKING ||
      modelId === JEMMIA_MODELS.EXPERT
    ) {
      log('Explicit mode detected. Skipping orchestration verification.');
      return { issues: [], isValid: true };
    }

    log('Triggering Agentic Verifier for automated reasoning response...');
    return AgenticVerifierService.verifyAnswer({
      ...rest,
      modelId,
      modelRuntime,
    });
  }

  /**
   * Resolves explicit user-requested modes or models.
   */
  public static resolve(params: { messages?: any[]; mode?: string; tools?: any[] }): ModelRoute {
    const { mode = 'auto' } = params;
    const requestedMode = mode.toLowerCase();

    // Map UI modes to specific model identifiers
    if (requestedMode === 'fast' || requestedMode === JEMMIA_MODELS.FAST) {
      return {
        model: JEMMIA_MODELS.FAST,
        provider: this.JEMMIA_PROVIDER,
        reason: 'explicit-fast',
      };
    }

    if (requestedMode === 'thinking' || requestedMode === JEMMIA_MODELS.THINKING) {
      return {
        model: JEMMIA_MODELS.THINKING,
        provider: this.JEMMIA_PROVIDER,
        reason: 'explicit-thinking',
      };
    }

    if (requestedMode === 'expert' || requestedMode === JEMMIA_MODELS.EXPERT) {
      return {
        model: JEMMIA_MODELS.EXPERT,
        provider: this.JEMMIA_PROVIDER,
        reason: 'explicit-expert',
      };
    }

    return {
      model: JEMMIA_MODELS.FAST,
      provider: this.JEMMIA_PROVIDER,
      reason: 'explicit-fallback',
    };
  }

  /**
   * Helper to extract chunks from the XML-formatted system prompt
   */
  public static extractChunks(content: string): any[] {
    const chunkRegex =
      /<chunk\s+fileId="([^"]+)"\s+fileName="([^"]+)"\s+similarity="([^"]+)">([\s\S]*?)<\/chunk>/g;
    const chunks = [];
    let match;

    while ((match = chunkRegex.exec(content)) !== null) {
      chunks.push({
        content: match[4],
        fileId: match[1],
        fileName: match[2],
        id: chunks.length.toString(), // Assign numeric ID for the skimmer
        rawContent: match[0], // Store the exact raw string for safe replacement later
        similarity: match[3],
        source: match[2],
      });
    }

    return chunks;
  }

  /**
   * Helper to rebuild the system prompt with only selected chunks
   */
  private static rebuildSystemPrompt(
    originalContent: string,
    allChunks: any[],
    selectedIds: string[],
  ): string {
    const chunkRegex =
      /<chunk\s+fileId="([^"]+)"\s+fileName="([^"]+)"\s+similarity="([^"]+)">([\s\S]*?)<\/chunk>/g;

    return originalContent
      .replaceAll(chunkRegex, (match) => {
        const chunk = allChunks.find((c) => c.rawContent === match);
        return chunk && selectedIds.includes(chunk.id) ? match : '';
      })
      .trim();
  }
}
