import { Flexbox } from '@lobehub/ui';
import { useTheme } from 'antd-style';
import { type FC, useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { isDesktop } from '@/const/version';
import ProtocolUrlHandler from '@/features/ProtocolUrlHandler';
import { useInitAgentConfig } from '@/hooks/useInitAgentConfig';
import { useIsDark } from '@/hooks/useIsDark';
import AgentIdSync from '@/routes/(main)/agent/_layout/AgentIdSync';

import Sidebar from '../../home/_layout/Sidebar';
import RegisterHotkeys from './RegisterHotkeys';
import { styles } from './style';

const Layout: FC = () => {
  useInitAgentConfig();
  const isDarkMode = useIsDark();
  const theme = useTheme();

  const cssVariables = useMemo<Record<string, string>>(
    () => ({
      '--content-bg-secondary': theme.colorBgContainerSecondary,
    }),
    [theme.colorBgContainerSecondary],
  );

  return (
    <Flexbox className={styles.absoluteContainer} height={'100%'} width={'100%'}>
      <Sidebar />
      <Flexbox
        className={isDarkMode ? styles.contentDark : styles.contentLight}
        flex={1}
        height={'100%'}
        style={cssVariables}
      >
        <Outlet />
      </Flexbox>
      <RegisterHotkeys />
      {isDesktop && <ProtocolUrlHandler />}
      <AgentIdSync />
    </Flexbox>
  );
};

export default Layout;
