import type { ChatStreamPayload } from '@lobechat/model-runtime';

import { JEMMIA_MODELS, ModelRouterService } from '@/server/services/modelRouter';

export { JEMMIA_MODELS };

export const selectJemmiaModel = (payload: ChatStreamPayload): string => {
  const result = ModelRouterService.resolve({
    messages: payload.messages,
    mode: payload.model,
    tools: payload.tools || [],
  });
  return result.model;
};
