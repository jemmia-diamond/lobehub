'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import ToggleLeftPanelButton from '@/features/NavPanel/ToggleLeftPanelButton';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const JemLogo = memo(() => {
  const expand = useGlobalStore((s) => systemStatusSelectors.showLeftPanel(s));

  return (
    <Flexbox
      horizontal
      align={'center'}
      gap={expand ? 12 : 0}
      height={48}
      justify={expand ? 'space-between' : 'center'}
      paddingBlock={8}
    >
      {expand && (
        <Flexbox horizontal align="center" gap={8} style={{ flex: 1 }}>
          <img alt="Jemmia" height={40} src="/logo_horizontal.svg" style={{ objectFit: 'contain' }} />
        </Flexbox>
      )}
      <Flexbox
        align={'center'}
        height={expand ? undefined : 32}
        justify={'center'}
        width={expand ? undefined : 40}
      >
        <ToggleLeftPanelButton
          size={expand ? { blockSize: 20, size: 20 } : { blockSize: 20, size: 20 }}
        />
      </Flexbox>
    </Flexbox>
  );
});

export default JemLogo;
