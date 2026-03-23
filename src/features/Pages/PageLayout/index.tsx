'use client';

import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import DataSync from './DataSync';
import Sidebar from './Sidebar';
import { styles } from './style';

const DesktopPagesLayout: FC = () => {
  const { enablePages } = useServerConfigStore(featureFlagsSelectors);

  if (!enablePages) return <Navigate replace to="/" />;

  return (
    <>
      <Sidebar />
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
      <DataSync />
    </>
  );
};

export default DesktopPagesLayout;
