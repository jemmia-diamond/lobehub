import type { FileContent, KnowledgeBaseInfo } from '@lobechat/prompts';
import { promptAgentKnowledge } from '@lobechat/prompts';
import debug from 'debug';

import { BaseFirstUserContentProvider } from '../base/BaseFirstUserContentProvider';
import type { PipelineContext, ProcessorOptions } from '../types';

declare module '../types' {
  interface PipelineContextMetadataOverrides {
    filesCount?: number;
    knowledgeBasesCount?: number;
    knowledgeInjected?: boolean;
  }
}

const log = debug('context-engine:provider:KnowledgeInjector');

export interface KnowledgeInjectorConfig {
  /** File contents to inject */
  fileContents?: FileContent[];
  /** Knowledge bases to inject */
  knowledgeBases?: KnowledgeBaseInfo[];
}

/**
 * Knowledge Injector
 * Responsible for injecting agent's knowledge (files and knowledge bases) into context
 * before the first user message
 */
export class KnowledgeInjector extends BaseFirstUserContentProvider {
  readonly name = 'KnowledgeInjector';

  constructor(
    private config: KnowledgeInjectorConfig,
    options: ProcessorOptions = {},
  ) {
    super(options);
  }

  protected buildContent(context: PipelineContext): string | null {
    const fileContents = this.config.fileContents || [];
    const knowledgeBases = this.config.knowledgeBases || [];

    // Generate unified knowledge prompt
    let formattedContent = promptAgentKnowledge({ fileContents, knowledgeBases });

    if (!formattedContent) {
      log('No knowledge to inject');
      return null;
    }

    // [New Logic] Smart Filtering for Multimodal Context
    // If the user has attached a NEW physical file (PDF/Image), we should "Whisper" the background knowledge
    // to prevent the AI from "ghosting" old files into the current task.
    if (context.metadata.hasCurrentMultimodalAttachments) {
      log('Current message has attachments, wrapping background knowledge in suppression tags');
      formattedContent = `
<background_knowledge_memory>
The following content is retrieved from your long-term library or knowledge base. 
IMPORTANT: If the user has attached a NEW file or image to the current message, PRIORITIZE the attached file.
IGNORE this background knowledge if it contradicts the current conversation or the newly attached document.

${formattedContent}
</background_knowledge_memory>
`.trim();
    }

    log(
      `Knowledge prepared: ${fileContents.length} file(s), ${knowledgeBases.length} knowledge base(s)`,
    );

    return formattedContent;
  }

  protected async doProcess(context: PipelineContext): Promise<PipelineContext> {
    const result = await super.doProcess(context);

    // Update metadata
    const fileContents = this.config.fileContents || [];
    const knowledgeBases = this.config.knowledgeBases || [];

    if (fileContents.length > 0 || knowledgeBases.length > 0) {
      result.metadata.knowledgeInjected = true;
      result.metadata.filesCount = fileContents.length;
      result.metadata.knowledgeBasesCount = knowledgeBases.length;
    }

    return result;
  }
}
