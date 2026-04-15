import { calculateMessageTokens } from '@lobechat/agent-runtime';
import { type ModelRuntime } from '@lobechat/model-runtime';
import { intelligentRoutingSystemPrompt, intelligentRoutingUserPrompt } from '@lobechat/prompts';
import debug from 'debug';

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
}

export class ModelRouterService {
  private static readonly JEMMIA_PROVIDER = 'jemmia';

  public static isJemmiaProvider(provider?: string): boolean {
    return provider === this.JEMMIA_PROVIDER;
  }

  public static isJemmiaModeOrModel(input: string): boolean {
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
  }): Promise<ModelRoute> {
    const { messages, tools, modelRuntime } = params;

    try {
      log('Evaluating intelligent routing...');

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
            },
            required: ['modelId'],
            type: 'object',
          },
        },
      });

      let modelId = (result as any)?.modelId;

      // Fallback: scan any string representation for a valid model ID
      if (!modelId) {
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
        const match = resultStr.match(/gemini-2\.5-(pro|flash-lite|flash)\b/);
        if (match) modelId = match[0];
      }

      if (modelId) {
        console.info(`[Brainy Intelligent Routing] Selected Model: ${modelId}`);
        return { model: modelId, provider: this.JEMMIA_PROVIDER };
      }
    } catch (error) {
      console.error(
        '[Brainy Intelligent Routing] Evaluation failed, falling back to resolve:',
        error,
      );
    }

    return this.resolve({ messages, tools });
  }

  public static resolve(params: {
    agentConfig?: any;
    messages: any[];
    tools: any[];
    mode?: string;
  }): ModelRoute {
    const { messages, tools, mode = 'auto' } = params;
    const requestedMode = mode.toLowerCase();

    if (requestedMode === 'fast' || requestedMode === JEMMIA_MODELS.FAST) {
      console.info(`[Brainy Mode] Mode: FAST → Model: ${JEMMIA_MODELS.FAST}`);
      return { model: JEMMIA_MODELS.FAST, provider: this.JEMMIA_PROVIDER };
    }

    if (requestedMode === 'thinking' || requestedMode === JEMMIA_MODELS.THINKING) {
      console.info(`[Brainy Mode] Mode: THINKING → Model: ${JEMMIA_MODELS.THINKING}`);
      return { model: JEMMIA_MODELS.THINKING, provider: this.JEMMIA_PROVIDER };
    }

    if (requestedMode === 'expert' || requestedMode === JEMMIA_MODELS.EXPERT) {
      console.info(`[Brainy Mode] Mode: EXPERT → Model: ${JEMMIA_MODELS.EXPERT}`);
      return { model: JEMMIA_MODELS.EXPERT, provider: this.JEMMIA_PROVIDER };
    }

    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const systemRoleTokens = calculateMessageTokens(systemMessages as any);
    const conversationTokens = calculateMessageTokens(nonSystemMessages as any);

    let totalFiles = 0;
    for (const msg of messages) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url' || part.type === 'file_url') {
            totalFiles += 1;
          }
        }
      }
    }

    const systemMessage = messages.find((m) => m.role === 'system');
    const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';
    const hasKnowledgeInjected =
      systemContent.includes('Knowledge Base') || systemRoleTokens > 2000;
    const hasLarkIntegration =
      messages.some(
        (m) => typeof m.content === 'string' && m.content.includes('Lark Document ID'),
      ) || tools.some((t) => t.identifier === 'lobe-lark-doc');

    const toolNames =
      tools?.map((t: any) => t.function?.name || t.identifier || t.type).join(', ') || 'none';
    log(
      `[Brainy Auto Debug] Conversation: ${conversationTokens} tokens, Files: ${totalFiles}, Tools: ${tools?.length || 0} [${toolNames}]`,
    );

    // Tier 3 — EXPERT: massive complexity (3+ files, extreme token count, or deep long-range reasoning)
    if (totalFiles >= 3 || conversationTokens > 256_000) {
      console.info(
        `[Brainy Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.EXPERT} (Reason: massive complexity – ${totalFiles} files, ${conversationTokens} tokens)`,
      );
      return { model: JEMMIA_MODELS.EXPERT, provider: this.JEMMIA_PROVIDER };
    }

    // Tier 2 — THINKING: RAG/Knowledge Base queries, multi-step reasoning,
    //          1-2 files, Lark integration, or long conversation history
    if (
      totalFiles > 0 ||
      hasKnowledgeInjected ||
      hasLarkIntegration ||
      conversationTokens > 128_000
    ) {
      console.info(
        `[Brainy Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.THINKING} (Reason: KB/RAG/files/Lark)`,
      );
      return { model: JEMMIA_MODELS.THINKING, provider: this.JEMMIA_PROVIDER };
    }

    // Tier 1 — FAST (default workhorse): direct questions, greetings, single-doc summaries, standard context
    console.info(
      `[Brainy Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.FAST} (Reason: standard interaction)`,
    );
    return { model: JEMMIA_MODELS.FAST, provider: this.JEMMIA_PROVIDER };
  }
}
