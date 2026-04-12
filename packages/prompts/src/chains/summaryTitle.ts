import { BRANDING_NAME, ORG_NAME } from '@lobechat/business-const';
import type { ChatStreamPayload, OpenAIChatMessage, UIChatMessage } from '@lobechat/types';

export const chainSummaryTitle = (
  messages: (UIChatMessage | OpenAIChatMessage)[],
  locale: string,
): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content: `You are a professional conversation summarizer of ${BRANDING_NAME} from ${ORG_NAME}. Generate a professional, authoritative, and concise title for this conversation.

Rules:
- ${ORG_NAME}-centric: Focus on the proprietary benefit and core intent of the conversation.
- Output ONLY the title text, no explanations or additional context
- Maximum 10 words
- Maximum 50 characters
- No punctuation marks
- Use the language specified by the locale code: ${locale}
- The title should accurately reflect the main topic of the conversation
- Keep it short and to the point`,
      role: 'system',
    },
    {
      content: messages.map((message) => `${message.role}: ${message.content}`).join('\n'),
      role: 'user',
    },
  ],
});
