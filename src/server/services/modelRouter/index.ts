import { calculateMessageTokens } from '@lobechat/agent-runtime';
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

  public static resolve(params: {
    agentConfig?: any;
    messages: any[];
    tools: any[];
    mode?: string;
  }): ModelRoute {
    const { messages, tools, mode = 'auto' } = params;
    const requestedMode = mode.toLowerCase();

    if (requestedMode === 'fast' || requestedMode === JEMMIA_MODELS.FAST) {
      console.info(`[Jemmora Mode] Mode: FAST → Model: ${JEMMIA_MODELS.FAST}`);
      return { model: JEMMIA_MODELS.FAST, provider: this.JEMMIA_PROVIDER };
    }

    if (requestedMode === 'thinking' || requestedMode === JEMMIA_MODELS.THINKING) {
      console.info(`[Jemmora Mode] Mode: THINKING → Model: ${JEMMIA_MODELS.THINKING}`);
      return { model: JEMMIA_MODELS.THINKING, provider: this.JEMMIA_PROVIDER };
    }

    if (requestedMode === 'expert' || requestedMode === JEMMIA_MODELS.EXPERT) {
      console.info(`[Jemmora Mode] Mode: EXPERT → Model: ${JEMMIA_MODELS.EXPERT}`);
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
      systemContent.includes('Lark Document ID') ||
      tools.some((t) => t.identifier === 'lobe-lark-doc');

    const toolNames =
      tools?.map((t: any) => t.function?.name || t.identifier || t.type).join(', ') || 'none';
    log(
      `[Jemmora Auto Debug] Conversation: ${conversationTokens} tokens, Files: ${totalFiles}, Tools: ${tools?.length || 0} [${toolNames}]`,
    );

    if (totalFiles >= 3 || conversationTokens > 32000 || hasLarkIntegration) {
      console.info(
        `[Jemmora Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.EXPERT} (Reason: complexity)`,
      );
      return { model: JEMMIA_MODELS.EXPERT, provider: this.JEMMIA_PROVIDER };
    }

    if (totalFiles > 0 || conversationTokens > 16000 || hasKnowledgeInjected) {
      console.info(
        `[Jemmora Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.THINKING} (Reason: context/RAG)`,
      );
      return { model: JEMMIA_MODELS.THINKING, provider: this.JEMMIA_PROVIDER };
    }

    console.info(
      `[Jemmora Auto] Mode: AUTO → Model: ${JEMMIA_MODELS.FAST} (Reason: simple interaction)`,
    );
    return { model: JEMMIA_MODELS.FAST, provider: this.JEMMIA_PROVIDER };
  }
}
