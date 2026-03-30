'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { useTheme } from 'antd-style';
import { memo } from 'react';

import BrandingLogo from '@/components/Branding/JemLogo';
import ToggleLeftPanelButton from '@/features/NavPanel/ToggleLeftPanelButton';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const JemLogo = memo(() => {
  const expand = useGlobalStore((s) => systemStatusSelectors.showLeftPanel(s));

  const theme = useTheme();
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
          <BrandingLogo size={24} />
          <Text
            style={{
              color: theme.colorText,
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '24px',
            }}
          >
            Jemmora
          </Text>
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
