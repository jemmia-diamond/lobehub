import type { ChatStreamPayload } from '@lobechat/model-runtime';

export const JEMMIA_MODELS = {
  EXPERT: 'gemini-2.5-pro',
  FAST: 'gemini-2.5-flash-lite',
  THINKING: 'gemini-2.5-flash',
};

/**
 * Expert keywords (English & Vietnamese)
 */
const EXPERT_KEYWORDS = [
  'analyze',
  'audit',
  'debug',
  'optimize',
  'strategy',
  'comprehensive',
  'detailed report',
  'phân tích',
  'chiến lược',
  'tối ưu',
  'summarize',
  'tóm tắt',
  'comparison',
  'so sánh',
  'report',
  'báo cáo',
];

/**
 * Coding patterns to detect development tasks (moved from frontend to server)
 */
const CODING_PATTERNS = [
  /const\s+\w+\s*=/,
  /function\s+\w+\s*\(/,
  /import\s+[\w{},*]+\s+from/,
  /export\s+(const|class|function|default)/,
  /public\s+class\s+\w+/,
  /def\s+\w+\(.*\):/,
  /package\s+[\w.]+;/,
  /using\s+System;/,
  /std::/,
  /<html>/,
  /<script/,
  /<div/,
  /console\.log/,
  /print\s*\(.*\)/,
  /```(typescript|javascript|python|css|html|go|rust|java|c\+\+)/,
  /refactor/i,
  /unittest/i,
  /mã nguồn/i,
];

/**
 * Select the best Jemmia model based on the request payload
 */
export const selectJemmiaModel = (payload: ChatStreamPayload): string => {
  const { messages, tools } = payload;

  // 1. Calculate approximate context size and count unique files
  let systemRoleChars = 0;
  let conversationChars = 0;
  let totalFiles = 0;

  for (const msg of messages) {
    let contentLen = 0;
    if (typeof msg.content === 'string') contentLen = msg.content.length;
    else if (Array.isArray(msg.content)) {
      contentLen = msg.content.reduce((pAcc, part) => {
        if (part.type === 'text') return pAcc + part.text.length;
        if (part.type === 'image_url' || part.type === 'file_url') {
          totalFiles += 1;
        }
        return pAcc;
      }, 0);
    }

    if (msg.role === 'system') {
      systemRoleChars += contentLen;
    } else {
      conversationChars += contentLen;
    }
  }

  const hasAttachments = totalFiles > 0;
  const totalChars = systemRoleChars + conversationChars;

  // 2. User intent detection (Expert keywords & Coding patterns)
  const systemMessage = messages.find((m) => m.role === 'system');
  const systemContent = typeof systemMessage?.content === 'string' ? systemMessage.content : '';

  // Detect RAG/Knowledge injection by looking for common headers or volume
  const hasKnowledgeInjected =
    systemContent.includes('Knowledge Base') ||
    systemContent.includes('Context') ||
    systemRoleChars > 10000;

  // Search only for the last USER message to determine intent
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserContent =
    typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content
      : Array.isArray(lastUserMessage?.content)
        ? lastUserMessage.content.find((p) => p.type === 'text')?.text || ''
        : '';

  const lowContent = lastUserContent.toLowerCase();
  const matchedExpertKeyword = EXPERT_KEYWORDS.find((keyword) => lowContent.includes(keyword));
  const matchedCodingPattern = CODING_PATTERNS.find((pattern) => pattern.test(lastUserContent));

  const containsExpertKeyword = !!matchedExpertKeyword;
  const isCodingTask = !!matchedCodingPattern;

  // 3. Decision Logic

  // DEBUG LOG
  const toolNames = tools?.map((t) => t.function?.name || t.type).join(', ') || 'none';
  console.info(
    `[Jemmora Auto Debug] Conversation: ${conversationChars} (System: ${systemRoleChars}), Knowledge Injected: ${hasKnowledgeInjected}, Files: ${totalFiles}, Tools: ${tools?.length || 0} [${toolNames}], Expert: ${containsExpertKeyword}, Coding: ${isCodingTask}`,
  );

  // CASE: High complexity or explicit expert task
  // trigger EXPERT if:
  // - totalFiles >= 3 (Requires cross-document reasoning)
  // - hasFiles AND containsExpertKeyword (e.g., 'summarize these files')
  // - mentions 'policy', 'warranty', 'grading' etc via containsExpertKeyword
  // - isCodingTask
  // - conversationChars > 128,000 (Actual user chat history is very deep)
  const isExpertRequired =
    totalFiles >= 3 ||
    (hasAttachments && containsExpertKeyword) ||
    containsExpertKeyword ||
    isCodingTask ||
    conversationChars > 128000;

  if (isExpertRequired) {
    const reason = isCodingTask
      ? `coding pattern (${matchedCodingPattern})`
      : hasAttachments && containsExpertKeyword
        ? `document analysis task (${matchedExpertKeyword} with ${totalFiles} files)`
        : containsExpertKeyword
          ? `expert keyword match (${matchedExpertKeyword})`
          : totalFiles >= 3
            ? `multi-file reasoning (${totalFiles} files)`
            : `large context (${conversationChars} user chars)`;

    console.info(
      `[Jemmora Auto] Selected EXPERT (${JEMMIA_MODELS.EXPERT}) due to ${reason}. (Total Chars: ${totalChars})`,
    );
    return JEMMIA_MODELS.EXPERT;
  }

  // CASE: Multimodal or Large context
  // We trigger THINKING if:
  // - has any attachments
  // - conversationChars > 64,000
  // (Tool calls are now handled by FAST unless one of the above is true)
  if (hasAttachments || conversationChars > 64000) {
    const reason = hasAttachments ? `${totalFiles} attachments` : 'large conversation context';
    console.info(
      `[Jemmora Auto] Selected THINKING (${JEMMIA_MODELS.THINKING}) due to ${reason}. (Total Chars: ${totalChars})`,
    );
    return JEMMIA_MODELS.THINKING;
  }

  // CASE: Standard instant greeting/simple chat
  // Flash-Lite (FAST) handles simple tool calls well enough for basic greetings/interactions
  console.info(
    `[Jemmora Auto] Selected FAST (${JEMMIA_MODELS.FAST}) for simple chat. (Total Chars: ${totalChars})`,
  );
  return JEMMIA_MODELS.FAST;
};
