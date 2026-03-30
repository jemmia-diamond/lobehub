'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { CURRENT_VERSION } from '@/const/version';
import SideBarLayout from '@/features/NavPanel/SideBarLayout';
import { useInitRecentTopic } from '@/hooks/useInitRecentTopic';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import Body from './Body';
import { AgentModalProvider } from './Body/Agent/ModalProvider';
import Header from './Header';

const VersionFooter = memo(() => {
  const { t } = useTranslation('home');
  const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);

  return (
    <Flexbox
      align="center"
      justify="center"
      style={{
        color: '#737373',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        fontStyle: 'normal',
        fontWeight: 400,
        letterSpacing: 'normal',
        lineHeight: '16px',
        paddingBlock: 16,
        paddingLeft: 12,
        paddingRight: expand ? 12 : 4,
        textAlign: 'center',
      }}
    >
      {expand ? t('sidebar.version', { version: CURRENT_VERSION }) : CURRENT_VERSION}
    </Flexbox>
  );
});

VersionFooter.displayName = 'VersionFooter';

const Sidebar = memo(() => {
  useInitRecentTopic();
  const expand = useGlobalStore(systemStatusSelectors.showLeftPanel);

  return (
    <AgentModalProvider>
      <SideBarLayout
        body={expand ? <Body /> : undefined}
        footer={<VersionFooter />}
        header={<Header />}
      />
    </AgentModalProvider>
  );
});

export default Sidebar;
