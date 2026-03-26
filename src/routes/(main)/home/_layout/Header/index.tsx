'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import NewConversationButton from '@/features/Conversation/NewConversationButton';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { mutate as swrMutate, useActionSWR } from '@/libs/swr';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { FETCH_RECENT_TOPICS_KEY } from '@/store/home/slices/recent';

import JemXLogo from './components/JemXLogo';

const Header = memo(() => {
  const router = useQueryRoute();
  const openNewTopicOrSaveTopic = useChatStore((s) => s.openNewTopicOrSaveTopic);
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const { mutate } = useActionSWR('openNewTopicOrSaveTopic', openNewTopicOrSaveTopic);

  const handleCreateNewConversation = async () => {
    if (inboxAgentId) router.push(`/agent/${inboxAgentId}`);
    else router.push('/agent');

    await mutate();
    await swrMutate((key) => Array.isArray(key) && key[0] === FETCH_RECENT_TOPICS_KEY);
  };

  return (
    <Flexbox
      gap={8}
      paddingInline={4}
      style={{
        paddingTop: 4,
      }}
    >
      <JemXLogo />
      <NewConversationButton onClick={handleCreateNewConversation} />
    </Flexbox>
  );
});

export default Header;
