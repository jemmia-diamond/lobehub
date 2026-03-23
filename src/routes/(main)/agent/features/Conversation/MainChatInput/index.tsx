'use client';

import { memo, useMemo } from 'react';

import { type ActionKeys } from '@/features/ChatInput';
import { ChatInput } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

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
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
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
      'typo',
      ...(isDevMode ? (['params'] as ActionKeys[]) : []),
      'mainToken',
    ],
    [enableModel, enableSearch, enableFileUpload, enableTools, isDevMode],
  );

  return (
    <ChatInput
      skipScrollMarginWithList
      leftActions={leftActions}
      rightActions={rightActions}
      {...(isDevMode
        ? { sendMenu: { items: sendMenuItems } }
        : { sendButtonProps: { shape: 'round' } })}
      onEditorReady={(instance) => {
        // Sync to global ChatStore for compatibility with other features
        useChatStore.setState({ mainInputEditor: instance });
      }}
    />
  );
});

MainChatInput.displayName = 'MainChatInput';

export default MainChatInput;
