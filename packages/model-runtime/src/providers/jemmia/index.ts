import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';
import { AgentRuntimeErrorType } from '../../types/error';

export const JemmiaAI = createOpenAICompatibleRuntime({
  errorType: {
    bizError: AgentRuntimeErrorType.ProviderBizError,
    invalidAPIKey: AgentRuntimeErrorType.InvalidProviderAPIKey,
  },
  provider: ModelProvider.Jemmia,
});

export default JemmiaAI;
