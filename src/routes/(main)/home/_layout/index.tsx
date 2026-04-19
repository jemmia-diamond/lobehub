import { Flexbox } from '@lobehub/ui';
import { type FC, type ReactNode } from 'react';
import { Activity, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useIsDark } from '@/hooks/useIsDark';
import { userService } from '@/services/user';

import HomeAgentIdSync from './HomeAgentIdSync';
import RecentHydration from './RecentHydration';
import { styles } from './style';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const isDarkMode = useIsDark();
  const { pathname } = useLocation();
  const isHomeRoute = pathname === '/';
  const [hasActivated, setHasActivated] = useState(isHomeRoute);
  const content = children ?? <Outlet />;

  useEffect(() => {
    if (isHomeRoute) setHasActivated(true);
  }, [isHomeRoute]);

  useEffect(() => {
    if (!hasActivated) return;
    void userService.getUserState().catch((err) => {
      console.error('Auth heartbeat (getUserState) failed:', err);
    });
  }, [hasActivated]);

  if (!hasActivated) return null;

  // Keep the Home layout alive and render it offscreen when inactive.
  return (
    <Activity mode={isHomeRoute ? 'visible' : 'hidden'} name="DesktopHomeLayout">
      <Flexbox
        className={isDarkMode ? styles.absoluteContainerDark : styles.absoluteContainer}
        height={'100%'}
        width={'100%'}
      >
        <Flexbox className={styles.main} height={'100%'} width={'100%'}>
          <Flexbox className={isDarkMode ? styles.cardDark : styles.card} flex={1}>
            {content}
          </Flexbox>
        </Flexbox>

        {isHomeRoute && <HomeAgentIdSync />}
        <RecentHydration />
      </Flexbox>
    </Activity>
  );
};

export default Layout;