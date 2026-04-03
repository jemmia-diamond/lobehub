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
  let totalFiles = 0;
  const totalChars = messages.reduce((acc, msg) => {
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

    if (msg.role === 'system') systemRoleChars += contentLen;
    return acc + contentLen;
  }, 0);

  const hasAttachments = totalFiles > 0;

  // 2. User intent detection (Expert keywords & Coding patterns)
  const lastMessage = messages.at(-1);
  const lastContent =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : Array.isArray(lastMessage?.content)
        ? lastMessage.content.find((p) => p.type === 'text')?.text || ''
        : '';

  const lowContent = lastContent.toLowerCase();
  const matchedExpertKeyword = EXPERT_KEYWORDS.find((keyword) => lowContent.includes(keyword));
  const matchedCodingPattern = CODING_PATTERNS.find((pattern) => pattern.test(lastContent));

  const containsExpertKeyword = !!matchedExpertKeyword;
  const isCodingTask = !!matchedCodingPattern;
  const hasTools = !!(tools && tools.length > 0);

  // 3. Decision Logic

  // DEBUG LOG
  const toolNames = tools?.map((t) => t.function?.name || t.type).join(', ') || 'none';
  console.info(
    `[Jemmora Auto Debug] Total: ${totalChars} (System: ${systemRoleChars}), Files: ${totalFiles}, Tools: ${tools?.length || 0} [${toolNames}], Expert: ${containsExpertKeyword}, Coding: ${isCodingTask}`,
  );

  // CASE: High complexity or explicit expert task
  // trigger EXPERT if:
  // - totalFiles >= 3 (Requires cross-document reasoning)
  // - hasFiles AND containsExpertKeyword (e.g., 'summarize these files')
  // - isCodingTask
  // - totalChars > 128,000
  const isExpertRequired =
    totalFiles >= 3 ||
    (hasAttachments && containsExpertKeyword) ||
    isCodingTask ||
    totalChars > 128000;

  if (isExpertRequired) {
    const reason = isCodingTask
      ? `coding pattern (${matchedCodingPattern})`
      : hasAttachments && containsExpertKeyword
        ? `document analysis task (${matchedExpertKeyword} with ${totalFiles} files)`
        : totalFiles >= 3
          ? `multi-file reasoning (${totalFiles} files)`
          : `large context (${totalChars} chars)`;

    console.info(
      `[Jemmora Auto] Selected EXPERT (${JEMMIA_MODELS.EXPERT}) due to ${reason}. (Total Chars: ${totalChars})`,
    );
    return JEMMIA_MODELS.EXPERT;
  }

  // CASE: Multimodal / Medium-Large context / Tool usage for normal tasks
  // We trigger THINKING if:
  // - has any attachments
  // - totalChars > 16,000
  // - hasTools (and not a simple greeting)
  if (hasAttachments || totalChars > 16000 || (hasTools && totalChars > 4000)) {
    const reason = hasAttachments
      ? `${totalFiles} attachments`
      : hasTools
        ? `tools (${tools?.length} active)`
        : 'medium-large context';
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
