'use client';

import { ASSISTANT_NAME, ASSISTANT_TITLE } from '@lobechat/business-const';
import { Avatar, Flexbox, Markdown, Text } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import JemAvatar from '@/components/JemAvatar';
import { DEFAULT_AVATAR } from '@/const/meta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useJemModeSelection } from '@/hooks/useJemModeSelection';
import { useAgentStore } from '@/store/agent';
import { agentSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import HomeHeader from '../../../../home/features/HomeHeader';
import ModeSelection from '../../../../home/features/ModeSelection';
import RecentsList from '../../../../home/features/Recents/List';
import OpeningQuestions from './OpeningQuestions';
import ToolAuthAlert from './ToolAuthAlert';

const InboxWelcome = memo(() => {
  const { t } = useTranslation(['welcome', 'chat', 'home']);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const isInbox = useAgentStore(builtinAgentSelectors.isInboxAgent);
  const openingQuestions = useAgentStore(agentSelectors.openingQuestions, isEqual);
  const mobile = useIsMobile();

  const fontSize = useUserStore(userGeneralSettingsSelectors.fontSize);
  const meta = useAgentStore(agentSelectors.currentAgentMeta, isEqual);

  const isLogin = useUserStore(authSelectors.isLogin);
  const {
    enableAgent,
    showHomeRecentResource,
    showHomeTopicHistory,
    showHomeModeSelection,
  } = useServerConfigStore(featureFlagsSelectors);

  const openingMessage = useAgentStore(agentSelectors.openingMessage);

  const { thinkingMode, handleModeChange } = useJemModeSelection();

  const agentSystemRoleMsg = useMemo(
    () =>
      t('agentDefaultMessageWithSystemRole', {
        name: meta.title || t('defaultAgent', { ns: 'chat' }),
        ns: 'chat',
      }),
    [meta.title, t],
  );

  const message = useMemo(() => {
    if (openingMessage) return openingMessage;
    return agentSystemRoleMsg;
  }, [openingMessage, agentSystemRoleMsg]);

  if (!activeAgentId) return null;

  const displayTitle = isInbox
    ? ASSISTANT_NAME
    : meta.title || t('defaultSession', { ns: 'common' });

  if (isInbox) {
    return (
      <Flexbox align="center" gap={36} justify="center" width="100%">
        <HomeHeader />
        {showHomeModeSelection && (
          <ModeSelection activeMode={thinkingMode} onChangeMode={handleModeChange} />
        )}
        {((showHomeTopicHistory && enableAgent && isLogin) ||
          (isLogin && showHomeRecentResource)) && (
          <Flexbox gap={40}>
            <RecentsList />
          </Flexbox>
        )}
        {openingQuestions.length > 0 && (
          <OpeningQuestions mobile={mobile} questions={openingQuestions} />
        )}
        <ToolAuthAlert />
      </Flexbox>
    );
  }

  return (
    <>
      <Flexbox
        align="center"
        gap={12}
        justify="center"
        width={'100%'}
        style={{
          paddingBottom: 48,
        }}
      >
        {isInbox ? (
          <JemAvatar size={78} />
        ) : (
          <Avatar
            avatar={meta.avatar || DEFAULT_AVATAR}
            background={meta.backgroundColor}
            shape={'square'}
            size={78}
          />
        )}
        <Text fontSize={32} weight={'bold'}>
          {displayTitle}
        </Text>
        <Flexbox width={'min(100%, 640px)'}>
          <Markdown fontSize={fontSize} variant={'chat'}>
            {isInbox
              ? t('guide.defaultMessageWithoutCreate', { appName: ASSISTANT_TITLE })
              : message}
          </Markdown>
        </Flexbox>
        {openingQuestions.length > 0 && (
          <OpeningQuestions mobile={mobile} questions={openingQuestions} />
        )}
        <ToolAuthAlert />
      </Flexbox>
    </>
  );
});

export default InboxWelcome;
