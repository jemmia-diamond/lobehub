'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SideBarLayout from '@/features/NavPanel/SideBarLayout';

import Body from './Body';
import { AgentModalProvider } from './Body/Agent/ModalProvider';
import Header from './Header';

const VersionFooter = memo(() => {
  const { t } = useTranslation('home');

  return (
    <Flexbox
      align="center"
      style={{
        borderTop: '1px solid #e2e8f0',
        color: '#475569',
        fontSize: 14,
        fontWeight: 500,
        paddingBlock: 16,
        paddingInline: 10,
      }}
    >
      {t('sidebar.version')}
    </Flexbox>
  );
});

VersionFooter.displayName = 'VersionFooter';

const Sidebar = memo(() => {
  return (
    <AgentModalProvider>
      <SideBarLayout
        header={<Header />}
        body={
          <Flexbox flex={1} justify="space-between" style={{ overflow: 'hidden' }}>
            <Body />
            <VersionFooter />
          </Flexbox>
        }
      />
    </AgentModalProvider>
  );
});

export default Sidebar;
