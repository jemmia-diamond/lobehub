'use client';

import { Flexbox } from '@lobehub/ui';
import debug from 'debug';
import { m as motion } from 'motion/react';
import { memo, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatMiniMap from '@/features/ChatMiniMap';
import {
  ChatList,
  ConversationProvider,
  TodoProgress,
  useConversationStore,
} from '@/features/Conversation';
import { dataSelectors } from '@/features/Conversation/store';
import JemChatInput from '@/features/JemChatInput';
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
import { useGatewayReconnect } from './useGatewayReconnect';

const log = debug('lobe-render:agent:ConversationArea');

/**
 * ConversationArea
 *
 * Main conversation area component using the new ConversationStore architecture.
 * Uses ChatList from @/features/Conversation and JemChatInput for custom features.
 */
const ConversationMain = memo(() => {
  const { t } = useTranslation('home');
  const context = useAgentContext();

  const displayMessageIds = useConversationStore(dataSelectors.displayMessageIds);
  const isWelcome = displayMessageIds.length === 0;

  return (
    <>
      <ZenModeToast />
      <Flexbox flex={1} height={'100%'} style={{ position: 'relative' }} width={'100%'}>
        <Flexbox
          flex={1}
          gap={isWelcome ? 36 : undefined}
          justify={isWelcome ? 'center' : 'flex-start'}
          width={'100%'}
        >
          <Flexbox
            flex={isWelcome ? 'none' : 1}
            width={'100%'}
            style={{
              overflowX: isWelcome ? 'visible' : 'hidden',
              overflowY: isWelcome ? 'visible' : 'auto',
              paddingInline: 24,
            }}
          >
            <ChatList welcome={<WelcomeChatItem />} />
          </Flexbox>

          <TodoProgress />

          <motion.div
            layout
            initial={false}
            transition={{ damping: 25, stiffness: 200, type: 'spring' }}
            style={{
              width: '100%',
              zIndex: 10,
            }}
          >
            <Flexbox flex={'none'} width={'100%'}>
              <WideScreenContainer>
                <JemChatInput
                  agentId={context.agentId}
                  threadId={context.threadId}
                  topicId={context.topicId}
                />
              </WideScreenContainer>
            </Flexbox>
          </motion.div>
        </Flexbox>

        <Flexbox
          align="center"
          flex={'none'}
          width={'100%'}
          style={{
            color: '#737373',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            fontStyle: 'normal',
            fontWeight: 400,
            letterSpacing: 'normal',
            lineHeight: '16px',
            paddingBlock: 12,
            textAlign: 'center',
          }}
        >
          {t('home.footer')}
        </Flexbox>
      </Flexbox>
      <ChatHydration />
      <ThreadHydration />
      <ChatMiniMap />
      <Suspense>
        <MessageFromUrl />
      </Suspense>
    </>
  );
});

const Conversation = memo(() => {
  const context = useAgentContext();

  // Get raw dbMessages from ChatStore for this context
  // ConversationStore will parse them internally to generate displayMessages
  const chatKey = useMemo(() => messageMapKey(context), [context]);
  const replaceMessages = useChatStore((s) => s.replaceMessages);
  const messages = useChatStore((s) => s.dbMessagesMap[chatKey]);
  log('contextKey %s: %o', chatKey, messages);

  // Get actionsBar config with branching support from ChatStore
  const actionsBarConfig = useActionsBarConfig();

  // Get operation state from ChatStore for reactive updates
  const operationState = useOperationState(context);

  // Auto-reconnect to running Gateway operation on topic load
  useGatewayReconnect(context.topicId);

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
      <ConversationMain />
    </ConversationProvider>
  );
});

Conversation.displayName = 'ConversationArea';

export default Conversation;
