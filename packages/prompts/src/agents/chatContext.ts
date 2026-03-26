import type { ChatContextContent } from '@lobechat/types';

/**
 * Format chat contexts into a system prompt context
 * Each context is wrapped in a <chat_context> tag with metadata
 */
export const formatChatContexts = (contexts: ChatContextContent[]): string => {
  if (!contexts || contexts.length === 0) {
    return '';
  }

  const formattedContexts = contexts
    .map((ctx) => {
      const titleAttr = ctx.title ? ` title="${ctx.title}"` : '';
      const typeAttr = ctx.type ? ` type="${ctx.type}"` : '';
      const formatAttr = ctx.format ? ` format="${ctx.format}"` : '';

      return `<context id="${ctx.id}"${titleAttr}${typeAttr}${formatAttr}>
${ctx.content}
</context>`;
    })
    .join('\n');

  return `<chat_contexts count="${contexts.length}">
${formattedContexts}
</chat_contexts>`;
};
