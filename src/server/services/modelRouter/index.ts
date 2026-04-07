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
  OPENAI_EXPERT: 'gpt-4o',
  OPENAI_FAST: 'gpt-4o-mini',
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

      // 1. Detect if RAG is present in the system prompt
      const systemMessage = messages.find((m) => m.role === 'system');
      const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';
      const containsChunks = systemContent.includes('<chunk') && systemContent.includes('</chunk>');

      // 2. If chunks are present, trigger Agentic Navigator (Skimmer)
      if (containsChunks) {
        log('RAG Chunks detected. Triggering Agentic Navigator...');
        const chunks = this.extractChunks(systemContent);

        if (chunks.length > 0) {
          const userMessage = messages.findLast((m) => m.role === 'user');
          const query =
            typeof userMessage?.content === 'string' ? userMessage.content : 'unknown query';

          const navigation = await AgenticNavigatorService.navigateChunks({
            chunks,
            modelRuntime,
            models: {
              ...JEMMIA_MODELS,
              FAST: JEMMIA_MODELS.OPENAI_FAST, // Default navigation to OpenAI Fast
            },
            query,
          });

          log(`Navigator reasoning: ${navigation.reasoning}`);

          // Re-construct messages with ONLY relevant chunks
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

      const result = await modelRuntime.generateObject({
        messages: [
          { content: intelligentRoutingSystemPrompt, role: 'system' },
          { content: intelligentRoutingUserPrompt(messages, tools), role: 'user' },
        ],
        model: JEMMIA_MODELS.OPENAI_FAST,
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

      // Try structured output first, then fall back to JSON.parse, then regex
      if (typeof result === 'object' && result !== null) {
        modelId = (result as any)?.modelId;
        scratchpad = (result as any)?.scratchpad;
      } else if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result);
          modelId = parsed?.modelId;
          scratchpad = parsed?.scratchpad;
        } catch {
          const match = result.match(/(gemini-2\.5-(pro|flash-lite|flash)|gpt-4o(-mini)?)/);
          if (match) modelId = match[0];
        }
      }

      if (modelId) {
        console.info(`[Router Triage] Reasoning: ${scratchpad || 'N/A'}`);
        console.info(`[Router Triage] Selected Model: ${modelId}`);
        return { model: modelId, provider: this.JEMMIA_PROVIDER, reason: 'intelligent-routing' };
      }
    } catch (error) {
      console.error('[Jemmora Routing] Evaluation failed, falling back to default FAST:', error);
    }

    return { model: JEMMIA_MODELS.FAST, provider: this.JEMMIA_PROVIDER, reason: 'fallback-fast' };
  }

  public static async verify(params: {
    answer: string;
    chunks: any[];
    modelId: string;
    modelRuntime: ModelRuntime;
    query: string;
  }): Promise<any> {
    const { query, answer, chunks, modelId, modelRuntime } = params;

    // OpenAI Standard: Only verify Expert-tier responses
    if (modelId === JEMMIA_MODELS.EXPERT || modelId === JEMMIA_MODELS.OPENAI_EXPERT) {
      log('Expert response detected. Triggering Agentic Verifier...');
      return AgenticVerifierService.verifyAnswer({
        answer,
        chunks,
        fastModel: JEMMIA_MODELS.OPENAI_FAST,
        modelRuntime,
        query,
      });
    }

    return { issues: [], isValid: true };
  }

  public static resolve(params: { messages?: any[]; mode?: string; tools?: any[] }): ModelRoute {
    const { mode = 'auto' } = params;
    const requestedMode = mode.toLowerCase();

    // 1. Explicit UI Mode Mapping
    if (
      requestedMode === 'fast' ||
      requestedMode === 'openai-fast' ||
      requestedMode === JEMMIA_MODELS.FAST ||
      requestedMode === JEMMIA_MODELS.OPENAI_FAST
    ) {
      const model =
        requestedMode === 'openai-fast' || requestedMode === JEMMIA_MODELS.OPENAI_FAST
          ? JEMMIA_MODELS.OPENAI_FAST
          : JEMMIA_MODELS.FAST;
      return { model, provider: this.JEMMIA_PROVIDER, reason: 'explicit-fast' };
    }

    if (requestedMode === 'thinking' || requestedMode === JEMMIA_MODELS.THINKING) {
      return {
        model: JEMMIA_MODELS.THINKING,
        provider: this.JEMMIA_PROVIDER,
        reason: 'explicit-thinking',
      };
    }

    if (
      requestedMode === 'expert' ||
      requestedMode === 'openai-expert' ||
      requestedMode === JEMMIA_MODELS.EXPERT ||
      requestedMode === JEMMIA_MODELS.OPENAI_EXPERT
    ) {
      const model =
        requestedMode === 'openai-expert' || requestedMode === JEMMIA_MODELS.OPENAI_EXPERT
          ? JEMMIA_MODELS.OPENAI_EXPERT
          : JEMMIA_MODELS.EXPERT;
      return { model, provider: this.JEMMIA_PROVIDER, reason: 'explicit-expert' };
    }

    // Default to Tier 1 - FAST for any unrecognized requests
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
    let newContent = originalContent;

    // Filter out chunks that were NOT selected
    for (const chunk of allChunks) {
      if (!selectedIds.includes(chunk.id)) {
        // Remove this chunk's XML from the prompt
        const escapedContent = chunk.content.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(
          `<chunk\\s+fileId="${chunk.fileId}"[^>]*>${escapedContent}<\\/chunk>\\s*`,
          'g',
        );
        newContent = newContent.replaceAll(pattern, '');
      }
    }

    return newContent;
  }
}
