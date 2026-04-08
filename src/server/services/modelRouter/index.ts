import { calculateMessageTokens } from '@lobechat/agent-runtime';
import { type ModelRuntime, safeParseJSON } from '@lobechat/model-runtime';
import { intelligentRoutingSystemPrompt, intelligentRoutingUserPrompt } from '@lobechat/prompts';
import debug from 'debug';

import { withRateLimitRetry } from '@/utils/retryPolicy';

import { AgenticNavigatorService } from './AgenticNavigatorService';
import { AgenticVerifierService } from './AgenticVerifierService';
import { ChunkManager } from './ChunkManager';
import type { ModelRoute } from './types';

const log = debug('lobechat:model-router');

export const JEMMIA_MODELS = {
  EXPERT: 'gemini-2.5-pro',
  FAST: 'gemini-2.5-flash-lite',
  THINKING: 'gemini-2.5-flash',
};

export type JemmiaMode = 'auto' | 'fast' | 'thinking' | 'expert' | (string & {});

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

      // 1. Context Analysis: Check for RAG context across all messages (System, Tool, etc.)
      const allChunks = ChunkManager.extractAllChunks(messages);

      // 2. Navigation Phase: If RAG chunks are present, perform hierarchical filtering
      if (allChunks.length > 0) {
        console.info(
          `[Jemmora Routing] RAG Chunks detected (${allChunks.length}). Starting Agentic Navigator...`,
        );
        const userMessage = messages.findLast((m) => m.role === 'user');
        const query =
          typeof userMessage?.content === 'string' ? userMessage.content : 'unknown query';

        const navigation = await AgenticNavigatorService.navigateChunks({
          chunks: allChunks,
          modelRuntime,
          models: JEMMIA_MODELS,
          query,
        });

        // Re-construct messages with narrowed context via ChunkManager
        const navigatedMessages = ChunkManager.rebuildMessages(
          messages,
          allChunks,
          navigation.relevantChunkIds,
        );

        return {
          messages: navigatedMessages,
          model: navigation.modelId,
          provider: this.JEMMIA_PROVIDER,
          reason: `agentic-navigation: ${navigation.relevantChunkIds.length}/${allChunks.length} chunks`,
        };
      }

      // 3. Triage Phase: General intent routing using the FAST tier model
      const totalTokens = calculateMessageTokens(messages);
      const totalFiles = messages.reduce((acc, m) => {
        if (Array.isArray(m.content)) {
          return (
            acc +
            (m.content as any[]).filter((c) => c.type === 'file' || c.type === 'image_url').length
          );
        }
        return acc;
      }, 0);

      console.info(
        `[Jemmora Routing] Triage Metrics: ${totalTokens} tokens, ${totalFiles} files. Selecting tier...`,
      );

      const result = await withRateLimitRetry(
        () =>
          modelRuntime.generateObject({
            messages: [
              { content: intelligentRoutingSystemPrompt, role: 'system' },
              {
                content: intelligentRoutingUserPrompt(messages, tools, {
                  files: totalFiles,
                  tokens: totalTokens,
                }),
                role: 'user',
              },
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
          }),
        3,
        '[Router Triage]',
      );

      let modelId: string | undefined;
      let scratchpad: string | undefined;

      // Handle structured output or defensive JSON extraction
      const parsed = safeParseJSON<{ modelId: string; scratchpad: string }>(result);
      if (!parsed) {
        console.error(`[Jemmora Routing] Triage Parse FAILED. Raw Result: ${result}`);
      }
      console.info(
        `[Jemmora Routing] Triage Result: ${parsed?.modelId || 'FALLBACK: FAST'}. Scratchpad: ${parsed?.scratchpad || 'N/A'}`,
      );

      if (parsed) {
        modelId = parsed.modelId;
        scratchpad = parsed.scratchpad;
      } else if (typeof result === 'string') {
        const modelIds = Object.values(JEMMIA_MODELS).join('|').replaceAll('.', '\\.');
        const match = result.match(new RegExp(`(${modelIds})`));
        if (match) modelId = match[0];
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
    return withRateLimitRetry(
      () =>
        AgenticVerifierService.verifyAnswer({
          ...rest,
          modelId,
          modelRuntime,
        }),
      3,
      '[Verifier]',
    );
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
}
