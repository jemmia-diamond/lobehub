'use client';

import { Flexbox } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { memo, Suspense } from 'react';

import NavHeader from '@/features/NavHeader';
import WideScreenButton from '@/features/WideScreenContainer/WideScreenButton';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import ShareButton from './ShareButton';

const Header = memo(() => {
  const { showChatShare } = useServerConfigStore(featureFlagsSelectors);

  return (
    <NavHeader
      right={
        <Flexbox horizontal style={{ backgroundColor: cssVar.colorBgContainer }}>
          <WideScreenButton />
          {showChatShare && (
            <Suspense>
              <ShareButton />
            </Suspense>
          )}
        </Flexbox>
      }
    />
  );
});

export default Header;
