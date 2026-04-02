import { type UserMemoryData } from '@lobechat/prompts';
import { promptUserMemory } from '@lobechat/prompts';
import debug from 'debug';

import { BaseFirstUserContentProvider } from '../base/BaseFirstUserContentProvider';
import { type PipelineContext, type ProcessorOptions } from '../types';

declare module '../types' {
  interface PipelineContextMetadataOverrides {
    userMemoryInjected?: boolean;
  }
}

const log = debug('context-engine:provider:UserMemoryInjector');

export interface UserMemoryInjectorConfig {
  enabled?: boolean;
  /** User memories data */
  memories?: UserMemoryData;
}

export interface MemoryContext {
  /** Effective memory effort for the current request */
  effort?: 'high' | 'low' | 'medium';
}

/**
 * User Memory Injector
 * Responsible for injecting user memories into context before the first user message
 */
export class UserMemoryInjector extends BaseFirstUserContentProvider {
  readonly name = 'UserMemoryInjector';

  constructor(
    private config: UserMemoryInjectorConfig,
    options: ProcessorOptions = {},
  ) {
    super(options);
  }

  protected buildContent(context: PipelineContext): string | null {
    if (this.config.enabled === false) return null;

    const { memories } = this.config;
    if (!memories) return null;

    let content = promptUserMemory({ memories });

    if (!content) {
      log('No user memories to inject');
      return null;
    }

    // [New Logic] Smart Filtering for Multimodal Context
    // If a new physical file is attached, old memories should be deprioritized.
    if (context.metadata.hasCurrentMultimodalAttachments) {
      log('Current message has attachments, wrapping user memory in suppression tags');
      content = `
<user_background_memory>
The following information is retrieved from your past memories. 
IMPORTANT: If the user has provided a NEW file or image in this message, that file is the PRIMARY context.
Be careful not to confuse historical memories with the specific document the user is currently referencing.

${content}
</user_background_memory>
`.trim();
    }

    const hasPersona = !!(memories.persona?.narrative || memories.persona?.tagline);
    const identitiesCount = memories.identities?.length || 0;
    const contextsCount = memories.contexts?.length || 0;
    const experiencesCount = memories.experiences?.length || 0;
    const preferencesCount = memories.preferences?.length || 0;

    log(
      `User memories prepared: persona=${hasPersona}, ${identitiesCount} identity(ies), ${contextsCount} context(s), ${experiencesCount} experience(s), ${preferencesCount} preference(s)`,
    );

    return content;
  }

  protected async doProcess(context: PipelineContext): Promise<PipelineContext> {
    const result = await super.doProcess(context);

    // Update metadata
    if (this.config.memories) {
      result.metadata.userMemoryInjected = true;
    }

    return result;
  }
}
