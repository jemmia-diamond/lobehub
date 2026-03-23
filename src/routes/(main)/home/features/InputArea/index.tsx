import { Flexbox } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AnimatePresence, m as motion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import DragUploadZone, { useUploadFiles } from '@/components/DragUploadZone';
import { type ActionKeys } from '@/features/ChatInput';
import { ChatInputProvider, DesktopChatInput } from '@/features/ChatInput';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { useHomeStore } from '@/store/home';
import {
  featureFlagsSelectors,
  serverConfigSelectors,
  useServerConfigStore,
} from '@/store/serverConfig';

import CommunityRecommend from '../CommunityRecommend';
import SuggestQuestions from '../SuggestQuestions';
import ModeTag from './ModeTag';
import SkillInstallBanner from './SkillInstallBanner';
import StarterList from './StarterList';
import { useSend } from './useSend';

const useStyles = createStyles(({ css }) => ({
  chatInputWrapper: css`
    .ant-btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 36px !important;
      height: 36px !important;
      border: none !important;
      border-radius: 14px !important;

      box-shadow: none !important;
    }

    .ant-btn-primary[disabled] {
      color: #a1a1aa !important;
      background: #f1f5f9 !important;
    }

    .ant-btn-primary:not([disabled]) {
      color: #fff !important;
      background: #111827 !important;
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

      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 7-7 7 7'/%3E%3Cpath d='M12 19V5'/%3E%3C/svg%3E")
        no-repeat center / contain;
    }
  `,
}));

const InputArea = () => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const { loading, send, inboxAgentId } = useSend();
  const inputActiveMode = useHomeStore((s) => s.inputActiveMode);
  const isLobehubSkillEnabled = useServerConfigStore(serverConfigSelectors.enableLobehubSkill);
  const isKlavisEnabled = useServerConfigStore(serverConfigSelectors.enableKlavis);
  const { enableSearch, enableTools, enableModel, enableFileUpload, showHomeSuggestion } =
    useServerConfigStore(featureFlagsSelectors);
  const showSkillBanner = isLobehubSkillEnabled || isKlavisEnabled;
  const chatInputRef = useRef<HTMLDivElement>(null);

  // When a starter mode is activated (e.g. Create Agent / Create Group / Write),
  // the SuggestQuestions panel renders below the ChatInput and may push the total
  // content height beyond the viewport, causing the ChatInput to scroll out of view.
  // Re-focus the editor and scroll it into view so the user can type immediately.
  useEffect(() => {
    if (!inputActiveMode) return;

    requestAnimationFrame(() => {
      chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      useChatStore.getState().mainInputEditor?.focus();
    });
  }, [inputActiveMode]);

  const model = useAgentStore((s) => agentByIdSelectors.getAgentModelById(inboxAgentId)(s));
  const provider = useAgentStore((s) =>
    agentByIdSelectors.getAgentModelProviderById(inboxAgentId)(s),
  );
  const { handleUploadFiles } = useUploadFiles({ model, provider });

  // A slot to insert content above the chat input
  // Override some default behavior of the chat input
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

  const hideStarterList = inputActiveMode && ['agent', 'group', 'write'].includes(inputActiveMode);
  const showSuggestQuestions =
    showHomeSuggestion &&
    (!inputActiveMode || ['agent', 'group', 'write'].includes(inputActiveMode));

  const extraActionItems = useMemo(() => {
    const defaultItems = [
      {
        children: (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', marginLeft: 8 }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          >
            <div
              style={{
                position: 'relative',
                background: '#dbeafe',
                color: '#1d4ed8',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 8,
                padding: '6px 12px',
                border: '1px solid #bfdbfe',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(30,64,175,0.2)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -6,
                  top: '50%',
                  marginTop: -6,
                  width: 12,
                  height: 12,
                  background: '#dbeafe',
                  borderLeft: '1px solid #bfdbfe',
                  borderBottom: '1px solid #bfdbfe',
                  boxShadow: '-2px 2px 4px rgba(30,64,175,0.1)',
                  transform: 'rotate(45deg)',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1 }}>{t('larkSelectAction')}</span>
            </div>
          </motion.div>
        ),
        key: 'lark-picker',
      },
    ];

    return inputActiveMode
      ? [
          ...defaultItems,
          {
            children: <ModeTag />,
            key: 'mode-tag',
          },
        ]
      : defaultItems;
  }, [inputActiveMode, t]);

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
            agentId={inboxAgentId}
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
                ...(enableFileUpload ? (['fileUpload'] as ActionKeys[]) : []),
                ...(enableTools ? (['tools'] as ActionKeys[]) : []),
              ] as ActionKeys[]
            }
            sendButtonProps={{
              disabled: loading,
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
                dropdownPlacement="bottomLeft"
                extraActionItems={extraActionItems}
                showRuntimeConfig={false}
                actionBarStyle={{
                  borderTop: '1px solid rgba(169, 180, 185, 0.1)',
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
              />
            </div>
          </ChatInputProvider>
        </DragUploadZone>
      </Flexbox>

      <div style={{ display: hideStarterList ? 'none' : undefined }}>
        <StarterList />
      </div>
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
};

export default InputArea;
