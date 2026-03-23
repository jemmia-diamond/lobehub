import { memo } from 'react';

import JemosChatInput from '@/features/JemosChatInput';

import { useAgentContext } from '../useAgentContext';

/**
 * MainChatInput
 *
 * Custom ChatInput implementation for main chat page.
 * USES JemosChatInput shared feature for unified UI experience.
 */
const MainChatInput = memo(() => {
  const { agentId } = useAgentContext();

  return <JemosChatInput agentId={agentId} />;
});

MainChatInput.displayName = 'MainChatInput';

export default MainChatInput;
