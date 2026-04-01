'use client';

import { Flexbox } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AnimatePresence, m as motion } from 'motion/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import DragUploadZone, { useUploadFiles } from '@/components/DragUploadZone';
import { type ActionKeys, ChatInputProvider, DesktopChatInput } from '@/features/ChatInput';
import ServerMode from '@/features/ChatInput/ActionBar/Upload/ServerMode';
import SearchDocsModal from '@/features/ResourceManager/components/SearchDocsModal';
import CommunityRecommend from '@/routes/(main)/home/features/CommunityRecommend';
import SuggestQuestions from '@/routes/(main)/home/features/SuggestQuestions';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { fileChatSelectors, useFileStore } from '@/store/file';
import { useHomeStore } from '@/store/home';
import {
  featureFlagsSelectors,
  serverConfigSelectors,
  useServerConfigStore,
} from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import SkillInstallBanner from './components/SkillInstallBanner';
import StarterList from './components/StarterList';
import ThinkingModeButton from './components/ThinkingModeButton';
import { useSend } from './hooks/useSend';

const useStyles = createStyles(({ css }) => ({
  chatInputWrapper: css`
    .ant-btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;

      aspect-ratio: 1 / 1 !important;
      width: 36px !important;
      min-width: 36px !important;
      height: 36px !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 50% !important;

      box-shadow: none !important;
    }

    .ant-btn-primary[disabled] {
      color: #fff !important;
      opacity: 0.3 !important;
      background: #171717 !important;
    }

    .ant-btn-primary:not([disabled]) {
      color: #fff !important;
      background: #171717 !important;
    }

    .ant-btn-primary:not(.ant-btn-loading) svg,
    .ant-btn-primary:not(.ant-btn-loading) .anticon {
      display: none !important;
      opacity: 0 !important;
    }

    .ant-btn-primary:not(.ant-btn-loading)::after {
      content: '';

      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      transform: translate(-50%, -50%);

      width: 18px;
      height: 18px;

      background: currentcolor;
    }

    /* Send Icon (Arrow Up) */
    .ant-btn-primary:not(.ant-btn-loading, [ant-click-animating-without-extra-node='true'])::after {
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z'/%3E%3C/svg%3E")
        no-repeat center / contain;
    }

    /* Stop Icon (Square) - Triggered when generating */
    .ant-btn-primary.ant-btn-loading::after,
    .ant-btn-primary[ant-click-animating-without-extra-node='true']::after {
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Crect width='16' height='16' x='4' y='4' rx='2'/%3E%3C/svg%3E")
        no-repeat center / contain;
    }
  `,
}));

interface JemChatInputProps {
  agentId?: string;
  showStarters?: boolean;
  threadId?: string | null;
  topicId?: string | null;
}

const JemChatInput = memo<JemChatInputProps>(({ agentId, showStarters, threadId, topicId }) => {
  const { styles } = useStyles();
  const { loading, send, inboxAgentId } = useSend({ agentId, threadId, topicId });
  const inputActiveMode = useHomeStore((s) => s.inputActiveMode);
  const [searchDocsModalOpen, setSearchDocsModalOpen] = useState<boolean>(false);

  const isLobehubSkillEnabled = useServerConfigStore(serverConfigSelectors.enableLobehubSkill);
  const isKlavisEnabled = useServerConfigStore(serverConfigSelectors.enableKlavis);
  const { enableSearch, enableTools, enableModel, enableFileUpload, showHomeSuggestion } =
    useServerConfigStore(featureFlagsSelectors);

  const showSkillBanner = isLobehubSkillEnabled || isKlavisEnabled;
  const chatInputRef = useRef<HTMLDivElement>(null);

  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

  // Focus and scroll into view when mode changes
  useEffect(() => {
    if (!inputActiveMode) return;

    requestAnimationFrame(() => {
      chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      useChatStore.getState().mainInputEditor?.focus();
    });
  }, [inputActiveMode]);

  const activeAgentId = agentId || inboxAgentId;

  const model = useAgentStore((s) => agentByIdSelectors.getAgentModelById(activeAgentId)(s));
  const provider = useAgentStore((s) =>
    agentByIdSelectors.getAgentModelProviderById(activeAgentId)(s),
  );
  const { handleUploadFiles } = useUploadFiles({ model, provider });

  const inputContainerProps = useMemo(
    () => ({
      minHeight: 88,
      resize: false,
      style: {
        borderRadius: 20,
        boxShadow: '0 12px 32px rgba(0,0,0,.04)',
      },
    }),
    [],
  );

  const hideStarterList =
    !showStarters || (inputActiveMode && ['agent', 'group', 'write'].includes(inputActiveMode));
  const showSuggestQuestions =
    showStarters &&
    showHomeSuggestion &&
    (!inputActiveMode || ['agent', 'group', 'write'].includes(inputActiveMode));

  const inputMessage = useChatStore((s) => s.inputMessage);
  const hasFiles = useFileStore(fileChatSelectors.chatUploadFileListHasItem);
  const hasContext = useFileStore(fileChatSelectors.chatContextSelectionHasItem);
  const isUploading = useFileStore(fileChatSelectors.isUploadingFiles);

  const isSendDisabled =
    loading || isUploading || (!inputMessage?.trim() && !hasFiles && !hasContext);

  return (
    <Flexbox gap={16} style={{ marginBottom: 16 }}>
      <Flexbox
        ref={chatInputRef}
        style={{ paddingBottom: showSkillBanner ? 32 : 0, position: 'relative' }}
      >
        {showSkillBanner && <SkillInstallBanner />}
        <DragUploadZone
          style={{ position: 'relative', zIndex: 1 }}
          onUploadFiles={handleUploadFiles}
        >
          <ChatInputProvider
            agentId={activeAgentId}
            allowExpand={false}
            slashPlacement="bottom"
            chatInputEditorRef={(instance) => {
              if (!instance) return;
              useChatStore.setState({ mainInputEditor: instance });
            }}
            leftActions={
              [
                ...(enableModel ? (['model'] as ActionKeys[]) : []),
                ...(enableSearch ? (['search'] as ActionKeys[]) : []),
                'memory',
                ...(enableTools ? (['tools'] as ActionKeys[]) : []),
                'typo',
                ...(isDevMode ? (['params'] as ActionKeys[]) : []),
                'mainToken',
              ] as ActionKeys[]
            }
            sendButtonProps={{
              disabled: isSendDisabled,
              generating: loading,
              onStop: () => {},
              shape: 'default',
            }}
            onSend={send}
            onMarkdownContentChange={(content) => {
              useChatStore.setState({ inputMessage: content });
            }}
          >
            <div className={styles.chatInputWrapper}>
              <DesktopChatInput
                showRuntimeConfig={false}
                actionBarStyle={{
                  marginTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                }}
                inputContainerProps={{
                  ...inputContainerProps,
                  minHeight: 88,
                  resize: false,
                  style: {
                    ...inputContainerProps?.style,
                    WebkitBackdropFilter: 'blur(24px)',
                    backdropFilter: 'blur(24px)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(169, 180, 185, 0.1)',
                    borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(42,52,57,0.06)',
                    padding: 4,
                  },
                }}
                leftContent={
                  <Flexbox horizontal align="center" gap={8} paddingInline={8}>
                    {enableFileUpload && <ServerMode />}
                  </Flexbox>
                }
                sendAreaPrefix={
                  <Flexbox style={{ marginRight: 10 }}>
                    <ThinkingModeButton />
                  </Flexbox>
                }
              />
            </div>
          </ChatInputProvider>
        </DragUploadZone>
      </Flexbox>

      <SearchDocsModal open={searchDocsModalOpen} onClose={() => setSearchDocsModalOpen(false)} />

      {showStarters && (
        <div style={{ display: hideStarterList ? 'none' : undefined }}>
          <StarterList />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {showSuggestQuestions && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            key={inputActiveMode ?? 'chat'}
            style={{ marginTop: inputActiveMode ? 0 : 24 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <Flexbox gap={24}>
              <SuggestQuestions mode={inputActiveMode} />
              <CommunityRecommend mode={inputActiveMode} />
            </Flexbox>
          </motion.div>
        )}
      </AnimatePresence>
    </Flexbox>
  );
});

JemChatInput.displayName = 'JemChatInput';

export default JemChatInput;
