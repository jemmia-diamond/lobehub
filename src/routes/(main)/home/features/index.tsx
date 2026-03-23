'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useHomeStore } from '@/store/home';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import InputArea from './InputArea';
import RecentPage from './RecentPage';
import RecentResource from './RecentResource';
import RecentTopic from './RecentTopic';
import WelcomeText from './WelcomeText';

const Home = memo(() => {
  useTranslation();
  const isLogin = useUserStore(authSelectors.isLogin);
  const inputActiveMode = useHomeStore((s) => s.inputActiveMode);

  // Hide other modules when a starter mode is active
  const hideOtherModules = inputActiveMode && ['agent', 'group', 'write'].includes(inputActiveMode);

  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const Welcome = useCallback(() => <WelcomeText />, []);

  return (
    <Flexbox gap={40}>
      <Welcome />
      <InputArea />
      {/* Use CSS visibility to hide instead of unmounting to prevent data re-fetching */}
      <Flexbox gap={40} style={{ display: hideOtherModules ? 'none' : undefined }}>
        {isLogin && (
          <>
            <RecentTopic />
            <RecentPage />
          </>
        )}
        {/* <CommunityAgents /> */}
        {/* <FeaturedPlugins /> */}
        {isLogin && <RecentResource />}
      </Flexbox>
    </Flexbox>
  );
});

export default Home;
