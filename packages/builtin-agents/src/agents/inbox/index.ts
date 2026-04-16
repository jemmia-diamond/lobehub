import { AgentDocumentsIdentifier } from '@lobechat/builtin-tool-agent-documents';
import { KnowledgeBaseIdentifier } from '@lobechat/builtin-tool-knowledge-base';
import { BRANDING_LOGO_URL } from '@lobechat/business-const';

import type { BuiltinAgentDefinition } from '../../types';
import { BUILTIN_AGENT_SLUGS } from '../../types';
import { createSystemRole } from './systemRole';

/**
 * Inbox Agent - the default assistant agent for general conversations
 *
 * Note: model and provider are intentionally undefined to use user's default settings
 */
export const INBOX: BuiltinAgentDefinition = {
  avatar: BRANDING_LOGO_URL || '/icons/icon-192x192.png',
  runtime: (ctx) => ({
    plugins: [AgentDocumentsIdentifier, KnowledgeBaseIdentifier, ...(ctx.plugins || [])],
    systemRole: createSystemRole(ctx.userLocale, ctx.userProfile),
  }),

  slug: BUILTIN_AGENT_SLUGS.inbox,
};
