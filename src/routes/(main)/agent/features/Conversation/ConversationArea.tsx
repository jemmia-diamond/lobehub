'use client';

import { Flexbox } from '@lobehub/ui';
import debug from 'debug';
import { memo, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CURRENT_VERSION } from '@/const/version';
import ChatMiniMap from '@/features/ChatMiniMap';
import { ChatList, ConversationProvider, TodoProgress } from '@/features/Conversation';
import JemosChatInput from '@/features/JemosChatInput';
import WideScreenContainer from '@/features/WideScreenContainer';
import ZenModeToast from '@/features/ZenModeToast';
import { useOperationState } from '@/hooks/useOperationState';
import { useChatStore } from '@/store/chat';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import WelcomeChatItem from './AgentWelcome';
import ChatHydration from './ChatHydration';
import MessageFromUrl from './MainChatInput/MessageFromUrl';
import ThreadHydration from './ThreadHydration';
import { useActionsBarConfig } from './useActionsBarConfig';
import { useAgentContext } from './useAgentContext';

const log = debug('lobe-render:agent:ConversationArea');

/**
 * ConversationArea
 *
 * Main conversation area component using the new ConversationStore architecture.
 * Uses ChatList from @/features/Conversation and JemosChatInput for custom features.
 */
const Conversation = memo(() => {
  const { t } = useTranslation('home');
  const context = useAgentContext();

  // Get raw dbMessages from ChatStore for this context
  // ConversationStore will parse them internally to generate displayMessages
  const chatKey = useMemo(() => messageMapKey(context), [context]);
  const replaceMessages = useChatStore((s) => s.replaceMessages);
  const messages = useChatStore((s) => s.dbMessagesMap[chatKey]);
  log('contextKey %s: %o', chatKey, messages);

  // Get operation state from ChatStore for reactive updates
  const operationState = useOperationState(context);

  // Get actionsBar config with branching support from ChatStore
  const actionsBarConfig = useActionsBarConfig();

  return (
    <ConversationProvider
      actionsBar={actionsBarConfig}
      context={context}
      hasInitMessages={!!messages}
      messages={messages}
      operationState={operationState}
      onMessagesChange={(messages, ctx) => {
        replaceMessages(messages, { context: ctx });
      }}
    >
      <ZenModeToast />
      <Flexbox
        flex={1}
        width={'100%'}
        style={{
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'relative',
          paddingInline: 24,
        }}
      >
        <ChatList welcome={<WelcomeChatItem />} />
      </Flexbox>
      <TodoProgress />

      <Flexbox flex={'none'} width={'100%'}>
        <WideScreenContainer>
          <JemosChatInput
            agentId={context.agentId}
            threadId={context.threadId}
            topicId={context.topicId}
          />
        </WideScreenContainer>
      </Flexbox>

      <Flexbox
        align="center"
        flex={'none'}
        width={'100%'}
        style={{
          paddingBlock: 12,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: '#9ca3af',
          textTransform: 'uppercase',
        }}
      >
        {t('home.footer', { version: CURRENT_VERSION })}
      </Flexbox>

      <ChatHydration />
      <ThreadHydration />
      <ChatMiniMap />
      <Suspense>
        <MessageFromUrl />
      </Suspense>
    </ConversationProvider>
  );
});

Conversation.displayName = 'ConversationArea';

export default Conversation;
