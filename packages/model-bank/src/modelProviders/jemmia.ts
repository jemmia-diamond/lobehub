import type { ModelProviderCard } from '@/types/llm';

const Jemmia: ModelProviderCard = {
  apiKeyUrl: 'https://jemmia.vn',
  chatModels: [],
  checkModel: 'gemini-3-flash-preview',
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
