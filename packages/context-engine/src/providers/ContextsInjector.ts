import { formatChatContexts } from '@lobechat/prompts';
import type { ChatContextContent } from '@lobechat/types';
import debug from 'debug';

import { BaseLastUserContentProvider } from '../base/BaseLastUserContentProvider';
import type { PipelineContext, ProcessorOptions } from '../types';

declare module '../types' {
  interface PipelineContextMetadataOverrides {
    contextsInjected?: boolean;
  }
}

const log = debug('context-engine:provider:ContextsInjector');

export interface ContextsInjectorConfig {
  /** Contexts to inject */
  contexts?: ChatContextContent[];
  /** Whether contexts injection is enabled */
  enabled?: boolean;
}

/**
 * Contexts Injector
 * Responsible for injecting additional contextual snippets (like Lark Docs)
 * at the end of the last user message.
 */
export class ContextsInjector extends BaseLastUserContentProvider {
  readonly name = 'ContextsInjector';

  constructor(
    private config: ContextsInjectorConfig,
    options: ProcessorOptions = {},
  ) {
    super(options);
  }

  protected async doProcess(context: PipelineContext): Promise<PipelineContext> {
    log('doProcess called');

    const clonedContext = this.cloneContext(context);

    // Check if we have contexts to inject
    const contexts = this.config.contexts;
    const hasContexts = this.config.enabled && contexts && contexts.length > 0;

    if (!hasContexts) {
      log('No contexts to inject, skipping');
      return this.markAsExecuted(clonedContext);
    }

    // Find the last user message index
    const lastUserIndex = this.findLastUserMessageIndex(clonedContext.messages);

    if (lastUserIndex === -1) {
      log('No user messages found, skipping injection');
      return this.markAsExecuted(clonedContext);
    }

    // Format contexts
    const formattedContent = formatChatContexts(contexts!);

    if (!formattedContent) {
      log('No content to inject after formatting');
      return this.markAsExecuted(clonedContext);
    }

    log('Contexts formatted, length:', formattedContent.length);

    // Check if system context wrapper already exists
    const hasExistingWrapper = this.hasExistingSystemContext(clonedContext);
    const contentToAppend = hasExistingWrapper
      ? this.createContextBlock(formattedContent, 'additional_context')
      : this.wrapWithSystemContext(formattedContent, 'additional_context');

    this.appendToLastUserMessage(clonedContext, contentToAppend);

    // Update metadata
    clonedContext.metadata.contextsInjected = true;

    log('Contexts appended to last user message');

    return this.markAsExecuted(clonedContext);
  }
}
