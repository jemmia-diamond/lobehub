'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

const HomeHeader = memo(() => {
  return (
    <Flexbox
      horizontal
      align="center"
      justify="space-between"
      style={{
        width: '100%',
        paddingBlock: 16,
        borderBottom: '1px solid rgba(148, 163, 184, 0.6)',
        backgroundColor: 'rgba(248, 250, 252, 0.9)',
        flexShrink: 0,
      }}
    >
      <Flexbox horizontal align="center" gap={16}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#1D4ED8',
          }}
        >
          Trợ lý JemX
        </span>
      </Flexbox>
    </Flexbox>
  );
});

export default HomeHeader;
