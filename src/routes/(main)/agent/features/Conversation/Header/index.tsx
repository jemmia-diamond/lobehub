'use client';

import { Flexbox } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import HeaderActions from './HeaderActions';
import ShareButton from './ShareButton';
import Tags from './Tags';

const Header = memo(() => {
  const { showChatShare, showChatMoreMenu } = useServerConfigStore(featureFlagsSelectors);

  return (
    <NavHeader
      left={
        <Flexbox style={{ backgroundColor: cssVar.colorBgContainer }}>
          <Tags />
        </Flexbox>
      }
      right={
        <Flexbox horizontal align={'center'} style={{ backgroundColor: cssVar.colorBgContainer }}>
          {showChatShare && <ShareButton />}
          {showChatMoreMenu && <HeaderActions />}
        </Flexbox>
      }
    />
  );
});

export default Header;
