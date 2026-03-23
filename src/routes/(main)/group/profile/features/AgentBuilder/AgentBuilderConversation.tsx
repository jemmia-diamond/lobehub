import { Flexbox } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import AgentBuilderWelcome from '@/features/AgentBuilder/AgentBuilderWelcome';
import { type ActionKeys } from '@/features/ChatInput';
import { ChatInput, ChatList } from '@/features/Conversation';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import TopicSelector from './TopicSelector';

interface AgentBuilderConversationProps {
  agentId: string;
}

/**
 * Agent Builder Conversation Component
 * Displays the chat interface for configuring the agent via conversation
 */
const AgentBuilderConversation = memo<AgentBuilderConversationProps>(({ agentId }) => {
  const { enableModel } = useServerConfigStore(featureFlagsSelectors);

  const actions: ActionKeys[] = useMemo(
    () => (enableModel ? (['model'] as ActionKeys[]) : []),
    [enableModel],
  );
  return (
    <Flexbox flex={1} height={'100%'}>
      <TopicSelector agentId={agentId} />
      <Flexbox flex={1} style={{ overflow: 'hidden' }}>
        <ChatList welcome={<AgentBuilderWelcome mode="group" />} />
      </Flexbox>
      <ChatInput leftActions={actions} />
    </Flexbox>
  );
});

export default AgentBuilderConversation;
