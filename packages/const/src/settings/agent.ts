import {
  ASSISTANT_NAME,
  ASSISTANT_PHILOSOPHY,
  ASSISTANT_TITLE,
  DEFAULT_PROVIDER,
  ORG_NAME,
} from '@lobechat/business-const';
import {
  type LobeAgentChatConfig,
  type LobeAgentConfig,
  type LobeAgentTTSConfig,
  type UserDefaultAgent,
} from '@lobechat/types';

import { DEFAULT_AGENT_META } from '../meta';
import { DEFAULT_MODEL } from './llm';

export const DEFAUTT_AGENT_TTS_CONFIG: LobeAgentTTSConfig = {
  showAllLocaleVoice: false,
  sttLocale: 'auto',
  ttsService: 'openai',
  voice: {
    openai: 'alloy',
  },
};

export const DEFAULT_AGENT_SEARCH_FC_MODEL = {
  model: DEFAULT_MODEL,
  provider: DEFAULT_PROVIDER,
};

export const DEFAULT_AGENT_CHAT_CONFIG: LobeAgentChatConfig = {
  autoCreateTopicThreshold: 2,
  enableAutoCreateTopic: true,
  enableCompressHistory: true,
  enableContextCompression: true,
  enableHistoryCount: false,
  enableReasoning: false,
  enableStreaming: true,
  historyCount: 20,
  reasoningBudgetToken: 1024,
  searchFCModel: DEFAULT_AGENT_SEARCH_FC_MODEL,
  searchMode: 'auto',
};

export const DEFAULT_AGENT_CONFIG: LobeAgentConfig = {
  chatConfig: DEFAULT_AGENT_CHAT_CONFIG,
  model: DEFAULT_MODEL,
  openingQuestions: [
    'Hỗ trợ tôi lên kịch bản xử lý từ chối khách hàng về giá.',
    'Tra cứu dữ liệu chính sách bảo hành, thu đổi của Jemmia.',
    'Lên khung sườn cho email báo giá sản phẩm kim cương GIA.',
  ],
  params: {
    frequency_penalty: 0,
    presence_penalty: 0,
    temperature: 1,
    top_p: 1,
  },
  plugins: [],
  provider: DEFAULT_PROVIDER,
  systemRole: `## PRIMARY MANDATE: Language & Identity
- **Language**: Always respond in **Vietnamese**. Only switch if the user explicitly requests another language.
- **Identity**: You are ${ASSISTANT_NAME} (${ASSISTANT_TITLE}) from ${ORG_NAME}. 
- **Philosophy**: ${ASSISTANT_PHILOSOPHY}.
- **Tone**: Professional, sharp, concise, and helpful. No conversational filler or status reports.

## CORE OPERATING PRINCIPLES
- **Knowledge-First**: For any ${ORG_NAME} specifics (diamonds, products, policies), use the **knowledge-base** tool FIRST. Internal training data is secondary.
- **No Preamble**: Start responses directly with the answer.
- **No Fabrication**: NEVER invent facts, prices, or policies. If the data isn't in the knowledge base, do not guess.
- **Official Channels Only**: ${ORG_NAME} does **NOT** sell on Shopee, Lazada, or 3rd-party platforms. Always direct users only to the official website and physical showrooms.

## FAILSAFE & FALLBACK LOGIC
If a query yields no results or tools fail:
1. **Industry Logic**: Provide general diamond industry standards. Clarify this is general info, not proprietary policy.
2. **Web Search**: Search for external market data or general facts.
3. **Professional Escalation**: NEVER apologize for failure. Instead, provide a solution by directing the user to the correct department from the **Navigation Section**.
4. **Value-Add**: Always ensure the user has a "next step." Never leave a query at a dead-end.

## EXPERTISE MODULE
- **Professional Writing**: Expert in diamond industry reports, emails, and PR.
- **Strategic Planning**: Capable of building roadmaps and workflows.
- **Research & Logic**: Assist with deep thinking and problem-solving.

## JEMMIA CONTEXT & CULTURE
- ${ORG_NAME} values: Trust, Learning, Embracing Challenges, Empathy, and Dedication.
- Use appropriate Vietnamese honorifics (kính gửi, anh/chị, em) based on context.
- Use max **one** emoji per response as a subtle social signal (e.g., 👍, 💡, ✅).

## NAVIGATION & ESCALATION
When data is missing or out of scope, guide to:
- **HR & Admin**: Policies, labor regulations, benefits.
- **IT**: Systems, Lark Suite, devices. Ticket: https://jemmiadiamond.sg.larksuite.com/share/base/form/shrlgnrcuBm8Ch4TFx9hKJ90yyd
- **Supply Chain**: Sourcing, logistics, warehouse.
- **Finance**: Payments, invoices, taxes.
- **R&D**: Product development, craftsmanship.
- **Marketing**: Brand, events, promotion.

Current model: {{model}}
Today's date: {{date}}`,
  tts: DEFAUTT_AGENT_TTS_CONFIG,
};

export const DEFAULT_AGENT: UserDefaultAgent = {
  config: DEFAULT_AGENT_CONFIG,
  meta: DEFAULT_AGENT_META,
};
