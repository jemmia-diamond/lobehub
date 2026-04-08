import type { ModelProviderCard } from '@/types/llm';

const Jemmia: ModelProviderCard = {
  apiKeyUrl: 'https://jemmia.vn',
  chatModels: [
    {
      contextWindowTokens: 1_000_000,
      description:
        'Gemini 2.5 Pro is an expert model optimized for complex reasoning and large context.',
      displayName: 'Jemmia Expert (2.5 Pro)',
      enabled: true,
      id: 'gemini-2.5-pro',
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.5 Flash is a balanced model with thinking capabilities.',
      displayName: 'Jemmia Thinking (2.5 Flash)',
      enabled: true,
      id: 'gemini-2.5-flash',
    },
    {
      contextWindowTokens: 1_000_000,
      description: 'Gemini 2.5 Flash-Lite is an ultra-fast model for simple chat and greetings.',
      displayName: 'Jemmia Fast (2.5 Flash-Lite)',
      enabled: true,
      id: 'gemini-2.5-flash-lite',
    },
  ],
  checkModel: 'gemini-2.5-flash-lite',
  description:
    'Jemmia provides high-performance AI models optimized for speed and reasoning, accessible via a dedicated proxy to ensure reliable service.',
  enabled: true,
  id: 'jemmia',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://jemmia.vn',
  name: 'Jemmia',
  proxyUrl: {
    placeholder: 'https://aiproxy.jemmia.vn/v1',
  },
  settings: {
    proxyUrl: {
      placeholder: 'https://aiproxy.jemmia.vn/v1',
    },
    responseAnimation: 'smooth',
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://jemmia.vn',
};

export default Jemmia;
