import { calculateMessageTokens } from '@lobechat/agent-runtime';
import type { ChatStreamPayload } from '@lobechat/model-runtime';

export const JEMMIA_MODELS = {
  EXPERT: 'gemini-2.5-pro',
  FAST: 'gemini-2.5-flash-lite',
  THINKING: 'gemini-2.5-flash',
};

/**
 * Select the best Jemmia model based on the request payload
 */
export const selectJemmiaModel = (payload: ChatStreamPayload): string => {
  const { messages, tools } = payload;

  // 1. Calculate token counts and count unique files
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  const systemRoleTokens = calculateMessageTokens(systemMessages as any);
  const conversationTokens = calculateMessageTokens(nonSystemMessages as any);
  const totalTokens = systemRoleTokens + conversationTokens;

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

  const hasAttachments = totalFiles > 0;

  // 2. User intent detection (Expert keywords & Coding patterns)
  const systemMessage = messages.find((m) => m.role === 'system');
  const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';

  // Detect RAG/Knowledge injection by looking for common headers or volume
  const hasKnowledgeInjected =
    systemContent.includes('Knowledge Base') ||
    systemContent.includes('Context') ||
    systemRoleTokens > 2000;

  // 3. Decision Logic

  // DEBUG LOG
  const toolNames = tools?.map((t) => t.function?.name || t.type).join(', ') || 'none';
  console.info(
    `[Jemmora Auto Debug] Conversation: ${conversationTokens} tokens (System: ${systemRoleTokens}), Knowledge Injected: ${hasKnowledgeInjected}, Files: ${totalFiles}, Tools: ${tools?.length || 0} [${toolNames}]`,
  );

  // CASE: High complexity or explicit expert task
  // - conversationTokens > 32,000 (User chat history is deep)
  const isExpertRequired = totalFiles >= 3 || conversationTokens > 32000;

  if (isExpertRequired) {
    const reason =
      totalFiles >= 3
        ? `multi-file reasoning (${totalFiles} files)`
        : `large context (${conversationTokens} tokens)`;

    console.info(
      `[Jemmora Auto] Selected EXPERT (${JEMMIA_MODELS.EXPERT}) due to ${reason}. (Total Tokens: ${totalTokens})`,
    );
    return JEMMIA_MODELS.EXPERT;
  }

  // CASE: Multimodal or Large context
  // We trigger THINKING if:
  // - has any attachments
  // - conversationTokens > 16,000
  // (Tool calls are now handled by FAST unless one of the above is true)
  if (hasAttachments || conversationTokens > 16000) {
    const reason = hasAttachments ? `${totalFiles} attachments` : 'large conversation context';
    console.info(
      `[Jemmora Auto] Selected THINKING (${JEMMIA_MODELS.THINKING}) due to ${reason}. (Total Tokens: ${totalTokens})`,
    );
    return JEMMIA_MODELS.THINKING;
  }

  // CASE: Standard instant greeting/simple chat
  // Flash-Lite (FAST) handles simple tool calls well enough for basic greetings/interactions
  console.info(
    `[Jemmora Auto] Selected FAST (${JEMMIA_MODELS.FAST}) for simple chat. (Total Tokens: ${totalTokens})`,
  );
  return JEMMIA_MODELS.FAST;
};
