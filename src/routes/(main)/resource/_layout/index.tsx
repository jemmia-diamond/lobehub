'use client';

import { type FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import RegisterHotkeys from './RegisterHotkeys';

const ResourceLayout: FC = () => {
  const { enableResource } = useServerConfigStore(featureFlagsSelectors);

  if (!enableResource) return <Navigate replace to="/" />;

  return (
    <>
      <Outlet />
      <RegisterHotkeys />
    </>
  );
};

export default ResourceLayout;
