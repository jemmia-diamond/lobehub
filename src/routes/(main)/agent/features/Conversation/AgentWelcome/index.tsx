'use client';

import { Avatar, Flexbox, Markdown, Text } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import JemosAvatar from '@/components/JemosAvatar';
import { DEFAULT_AVATAR } from '@/const/meta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useJemmiaModeSelection } from '@/hooks/useJemmiaModeSelection';
import { useAgentStore } from '@/store/agent';
import { agentSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import HomeHeader from '../../../../home/features/HomeHeader';
import ModeSelection from '../../../../home/features/ModeSelection';
import RecentPage from '../../../../home/features/RecentPage';
import RecentResource from '../../../../home/features/RecentResource';
import RecentTopic from '../../../../home/features/RecentTopic';
import OpeningQuestions from './OpeningQuestions';
import ToolAuthAlert from './ToolAuthAlert';

const InboxWelcome = memo(() => {
  const { t } = useTranslation(['welcome', 'chat', 'home']);
  const mobile = useIsMobile();
  const isInbox = useAgentStore(builtinAgentSelectors.isInboxAgent);
  const openingQuestions = useAgentStore(agentSelectors.openingQuestions, isEqual);
  const fontSize = useUserStore(userGeneralSettingsSelectors.fontSize);
  const meta = useAgentStore(agentSelectors.currentAgentMeta, isEqual);

  const isLogin = useUserStore(authSelectors.isLogin);
  const { enableAgent, showHomeRecentTopic, showHomeRecentPage, showHomeTopicHistory } =
    useServerConfigStore(featureFlagsSelectors);

  const agentSystemRoleMsg = t('agentDefaultMessageWithSystemRole', {
    name: meta.title || t('defaultAgent', { ns: 'chat' }),
    ns: 'chat',
  });
  const openingMessage = useAgentStore(agentSelectors.openingMessage);

  const { thinkingMode, handleModeChange } = useJemmiaModeSelection();

  const message = useMemo(() => {
    if (openingMessage) return openingMessage;
    return agentSystemRoleMsg;
  }, [openingMessage, agentSystemRoleMsg]);

  const displayTitle = isInbox
    ? 'Trợ lý JemX'
    : meta.title || t('defaultSession', { ns: 'common' });

  if (isInbox) {
    return (
      <Flexbox gap={40} width="100%">
        <HomeHeader />
        <ModeSelection activeMode={thinkingMode} onChangeMode={handleModeChange} />
        <Flexbox gap={40}>
          {showHomeTopicHistory && enableAgent && isLogin && (
            <>
              {showHomeRecentTopic && <RecentTopic />}
              {showHomeRecentPage && <RecentPage />}
            </>
          )}
          {isLogin && <RecentResource />}
        </Flexbox>
        {openingQuestions.length > 0 && (
          <OpeningQuestions mobile={mobile} questions={openingQuestions} />
        )}
        <ToolAuthAlert />
      </Flexbox>
    );
  }

  return (
    <>
      <Flexbox flex={1} />
      <Flexbox
        gap={12}
        width={'100%'}
        style={{
          paddingBottom: 'max(10vh, 32px)',
        }}
      >
        {isInbox ? (
          <JemosAvatar size={78} />
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
            {isInbox ? t('guide.defaultMessageWithoutCreate', { appName: 'Trợ lý JemX' }) : message}
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
