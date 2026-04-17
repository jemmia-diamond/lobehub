'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useJemModeSelection } from '@/hooks/useJemModeSelection';
import { useHomeStore } from '@/store/home';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import CommunityAgents from './CommunityAgents';
import HomeHeader from './HomeHeader';
import InputArea from './InputArea';
import ModeSelection from './ModeSelection';
import RecentPage from './RecentPage';
import RecentResource from './RecentResource';
import RecentTopic from './RecentTopic';

export const ScrollableContent = memo(() => {
  useTranslation();
  const isLogin = useUserStore(authSelectors.isLogin);
  const inputActiveMode = useHomeStore((s) => s.inputActiveMode);
  const {
    enableAgent,
    showHomeRecentTopic,
    showHomeRecentPage,
    showHomeRecentResource,
    showHomeTopicHistory,
    showHomeModeSelection,
  } = useServerConfigStore(featureFlagsSelectors);
  const { handleModeChange, thinkingMode } = useJemModeSelection();

  const hideOtherModules = inputActiveMode && ['agent', 'group', 'write'].includes(inputActiveMode);

  return (
    <Flexbox gap={40} width="100%">
      <HomeHeader />
      {showHomeModeSelection && (
        <ModeSelection activeMode={thinkingMode} onChangeMode={handleModeChange} />
      )}
      <Flexbox gap={40} style={{ display: hideOtherModules ? 'none' : undefined }}>
        {showHomeTopicHistory && enableAgent && isLogin && (
          <>
            {showHomeRecentTopic && <RecentTopic />}
            {showHomeRecentPage && <RecentPage />}
          </>
        )}
        {isLogin && showHomeRecentResource && <CommunityAgents />}
        {isLogin && showHomeRecentResource && <RecentResource />}
      </Flexbox>
    </Flexbox>
  );
});

ScrollableContent.displayName = 'ScrollableContent';

export const PinnedInputArea = memo(() => {
  return <InputArea />;
});

PinnedInputArea.displayName = 'PinnedInputArea';

const Home = memo(() => {
  return (
    <Flexbox gap={40}>
      <ScrollableContent />
      <InputArea />
    </Flexbox>
  );
});

export default Home;
