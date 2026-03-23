'use client';

import { memo, useMemo } from 'react';

import { type ActionKeys } from '@/features/ChatInput';
import { ChatInput } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import { useSendMenuItems } from './useSendMenuItems';

const rightActions: ActionKeys[] = [];

/**
 * MainChatInput
 *
 * Custom ChatInput implementation for main chat page.
 * Uses ChatInput from @/features/Conversation which handles all send logic
 * including error alerts display.
 * Only adds MessageFromUrl for desktop mode.
 */
const MainChatInput = memo(() => {
  const sendMenuItems = useSendMenuItems();
  const { enableSearch, enableTools, enableModel, enableFileUpload } =
    useServerConfigStore(featureFlagsSelectors);

  const leftActions: ActionKeys[] = useMemo(
    () => [
      ...(enableModel ? (['model'] as ActionKeys[]) : []),
      ...(enableSearch ? (['search'] as ActionKeys[]) : []),
      'memory',
      ...(enableFileUpload ? (['fileUpload'] as ActionKeys[]) : []),
      ...(enableTools ? (['tools'] as ActionKeys[]) : []),
      '---',
      ['typo', 'params', 'clear'],
      'mainToken',
    ],
    [enableModel, enableSearch, enableFileUpload, enableTools],
  );

  return (
    <ChatInput
      skipScrollMarginWithList
      leftActions={leftActions}
      rightActions={rightActions}
      sendMenu={{ items: sendMenuItems }}
      onEditorReady={(instance) => {
        // Sync to global ChatStore for compatibility with other features
        useChatStore.setState({ mainInputEditor: instance });
      }}
    />
  );
});

MainChatInput.displayName = 'MainChatInput';

export default MainChatInput;
