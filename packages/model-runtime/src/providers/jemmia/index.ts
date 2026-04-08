import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';
import type { ChatMethodOptions, ChatStreamPayload } from '../../types/chat';
import { AgentRuntimeErrorType } from '../../types/error';

const BaseJemmiaAI = createOpenAICompatibleRuntime({
  chatCompletion: {
    forceFileBase64: true,
    forceImageBase64: true,
  },
  constructorOptions: {
    maxRetries: 0,
  },
  errorType: {
    bizError: AgentRuntimeErrorType.ProviderBizError,
    invalidAPIKey: AgentRuntimeErrorType.InvalidProviderAPIKey,
  },
  provider: ModelProvider.Jemmia,
});

export class JemmiaAI extends BaseJemmiaAI {
  async chat(payload: ChatStreamPayload, options?: ChatMethodOptions) {
    const maxRetries = 5;
    let attempt = 0;
    let lastError: any;

    while (attempt < maxRetries) {
      try {
        return await super.chat(payload, options);
      } catch (error: any) {
        lastError = error;
        attempt++;

        if (attempt < maxRetries) {
          console.warn(
            `[JemmiaAI] Request failed (${error.message}). Retrying ${attempt}/${maxRetries}...`,
          );
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const fallbackModel = 'gemini-2.5-pro';
    if (payload.model !== fallbackModel) {
      console.warn(
        `[JemmiaAI] All ${maxRetries} retries failed for model ${payload.model}. Falling back to ${fallbackModel}. Error:`,
        lastError?.message,
      );
      payload.model = fallbackModel;

      return await super.chat(payload, options);
    }

    throw lastError;
  }
}

export default JemmiaAI;
