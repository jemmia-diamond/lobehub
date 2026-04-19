import { parse } from '@lobechat/conversation-flow';
import { type ConversationContext, type UIChatMessage } from '@lobechat/types';
import isEqual from 'fast-deep-equal';
import { type SWRResponse } from 'swr';

import { INBOX_SESSION_ID } from '@/const/session';
import { mutate, useClientDataSWRWithSync } from '@/libs/swr';
import { messageService } from '@/services/message';
import { type ChatStore } from '@/store/chat/store';
import { FETCH_RECENTS_KEY } from '@/store/home/slices/recent';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { messageMapKey } from '../../../utils/messageMapKey';
import { type MessageMapKeyInput } from '../../../utils/messageMapKey';
import { FETCH_MESSAGES_KEY } from './constants';

const n = setNamespace('query');

/**
 * Data query and synchronization actions
 * Handles fetching, refreshing, and replacing message data
 */

type Setter = StoreSetter<ChatStore>;
export const messageQuery = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new MessageQueryActionImpl(set, get, _api);

export class MessageQueryActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshMessages = async (context?: Partial<ConversationContext>): Promise<void> => {
    const agentId = context?.agentId ?? this.#get().activeAgentId;
    const topicId = context?.topicId !== undefined ? context.topicId : this.#get().activeTopicId;

    // 1. Refresh global messages for current context
    await mutate([FETCH_MESSAGES_KEY, { agentId, topicId }]);

    // 2. Refresh recents list (sidebar)
    await mutate(
      (key) =>
        (typeof key === 'string' && key === FETCH_RECENTS_KEY) ||
        (Array.isArray(key) && key[0] === FETCH_RECENTS_KEY),
    );
  };

  replaceMessages = (
    messages: UIChatMessage[],
    params?: {
      action?: any;

      context?: Partial<ConversationContext>;

      operationId?: string;
    },
  ): void => {
    let ctx: MessageMapKeyInput;

    // Priority 1: Use explicit context if provided (preserving scope)
    if (params?.context) {
      ctx = {
        agentId: params.context.agentId ?? this.#get().activeAgentId,
        // Preserve groupId from context
        groupId: params.context.groupId,
        // Preserve scope from context
        isNew: params.context.isNew,

        scope: params.context.scope,

        threadId: params.context.threadId,
        topicId:
          params.context.topicId !== undefined ? params.context.topicId : this.#get().activeTopicId,
      };
    }
    // Priority 2: Get full context from operation if operationId is provided (deprecated)
    else if (params?.operationId) {
      ctx = this.#get().internal_getConversationContext(params);
    }
    // Priority 3: Fallback to global state
    else {
      ctx = {
        agentId: this.#get().activeAgentId,
        groupId: this.#get().activeGroupId,
        threadId: this.#get().activeThreadId,
        topicId: this.#get().activeTopicId,
      };
    }

    const messagesKey = messageMapKey(ctx);

    // Get raw messages from dbMessagesMap and apply reducer
    const nextDbMap = { ...this.#get().dbMessagesMap, [messagesKey]: messages };

    if (isEqual(nextDbMap, this.#get().dbMessagesMap)) return;

    // Parse messages using conversation-flow
    const { flatList } = parse(messages);

    this.#set(
      {
        // Store raw messages from backend
        dbMessagesMap: nextDbMap,
        // Store parsed messages for display
        messagesMap: { ...this.#get().messagesMap, [messagesKey]: flatList },
      },
      false,
      params?.action ?? 'replaceMessages',
    );
  };

  useFetchMessages = (
    context: ConversationContext,
    skipFetch?: boolean,
  ): SWRResponse<UIChatMessage[]> => {
    // Skip fetch when skipFetch is true or required fields are missing
    // Allow topicId to be null ONLY for the inbox, but not for other agents (new topic state)
    const isInbox = context.agentId === INBOX_SESSION_ID;
    const shouldFetch = !skipFetch && !!context.agentId && (!!context.topicId || isInbox);

    return useClientDataSWRWithSync<UIChatMessage[]>(
      shouldFetch ? [FETCH_MESSAGES_KEY, context] : null,
      () => messageService.getMessages(context),
      {
        onData: (data) => {
          if (!data || context.topicId === undefined) return;

          // Use replaceMessages to store the fetched messages
          this.#get().replaceMessages(data, { action: 'useFetchMessages', context });
          this.#set({ messagesInit: true }, false, n('useFetchMessages/init'));
        },
      },
    );
  };
}

export type MessageQueryAction = Pick<MessageQueryActionImpl, keyof MessageQueryActionImpl>;
