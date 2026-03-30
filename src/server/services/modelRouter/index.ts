import debug from 'debug';

const log = debug('lobechat:model-router');

export interface ModelRoute {
  model: string;
  provider: string;
}

export class ModelRouterService {
  private static readonly DEFAULT_FAST_MODEL: ModelRoute = {
    model: 'gemini-2.5-flash-lite',
    provider: 'jemmia',
  };

  private static readonly DEFAULT_STANDARD_MODEL: ModelRoute = {
    model: 'gemini-2.5-flash',
    provider: 'jemmia',
  };

  private static readonly DEFAULT_PRO_MODEL: ModelRoute = {
    model: 'gemini-2.5-pro',
    provider: 'jemmia',
  };

  public static resolve(params: { agentConfig?: any; messages: any[]; tools: any[] }): ModelRoute {
    const { messages, tools } = params;

    const hasLarkDocInContext = messages.some(
      (m) => typeof m.content === 'string' && m.content.includes('Lark Document ID'),
    );
    const hasLarkTool = tools.some((t) => t.identifier === 'lobe-lark-doc');
    const hasLocalFilesOrImages = messages.some((m) => {
      if (Array.isArray(m.content)) {
        return m.content.some((c: any) => c.type === 'image_url' || c.type === 'file_url');
      }
      return false;
    });

    if (hasLarkDocInContext || hasLarkTool || hasLocalFilesOrImages) {
      log('Routing to PRO model due to file/image manipulation or Lark integration');
      return this.DEFAULT_PRO_MODEL;
    }

    const messageCount = messages.filter((m) => m.role !== 'system').length;
    const toolCount = tools.length;

    if (messageCount > 15 || toolCount > 5) {
      log(
        'Routing to PRO model due to high complexity (messages: %d, tools: %d)',
        messageCount,
        toolCount,
      );
      return this.DEFAULT_PRO_MODEL;
    }

    if (messageCount > 5 || toolCount > 0) {
      log('Routing to STANDARD model (messages: %d, tools: %d)', messageCount, toolCount);
      return this.DEFAULT_STANDARD_MODEL;
    }

    log('Routing to FAST model for simple chat');
    return this.DEFAULT_FAST_MODEL;
  }
}
