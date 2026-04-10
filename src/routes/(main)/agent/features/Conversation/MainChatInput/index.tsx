'use client';

import { memo, useMemo } from 'react';

import { type ActionKeys } from '@/features/ChatInput';
import { ChatInput } from '@/features/Conversation';
import { useChatStore } from '@/store/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { useSendMenuItems } from './useSendMenuItems';

const rightActions: ActionKeys[] = ['promptTransform'];

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
    <div style={{ paddingInline: 16, paddingBottom: 16 }}>
      <ChatInput
        skipScrollMarginWithList
        leftActions={leftActions}
        rightActions={rightActions}
        {...(isDevMode
          ? { sendMenu: { items: sendMenuItems } }
          : { sendButtonProps: { shape: 'round' } })}
        inputContainerProps={{
          minHeight: 88,
          resize: false,
          style: {
            WebkitBackdropFilter: 'blur(24px)',
            backdropFilter: 'blur(24px)',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(169, 180, 185, 0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(42,52,57,0.06)',
            padding: 4,
          },
        }}
        onEditorReady={(instance) => {
          // Sync to global ChatStore for compatibility with other features
          useChatStore.setState({ mainInputEditor: instance });
        }}
      />
    </div>
  );
});

MainChatInput.displayName = 'MainChatInput';

export default MainChatInput;
