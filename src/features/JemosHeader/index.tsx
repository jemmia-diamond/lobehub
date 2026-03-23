'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

interface JemosHeaderProps {
  children?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

const JemosHeader = memo<JemosHeaderProps>(({ left, right, children }) => {
  return (
    <Flexbox
      horizontal
      align="center"
      justify="space-between"
      style={{
        width: '100%',
        paddingBlock: 16,
        paddingInline: 16,
        borderBottom: '1px solid rgba(148, 163, 184, 0.6)',
        backgroundColor: 'rgba(248, 250, 252, 0.9)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <Flexbox horizontal align="center" gap={16}>
        {left || (
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: '#1D4ED8',
            }}
          >
            Trợ lý JemX
          </span>
        )}
      </Flexbox>
      {children}
      <Flexbox horizontal align="center" gap={16}>
        {right}
      </Flexbox>
    </Flexbox>
  );
});

JemosHeader.displayName = 'JemosHeader';

export default JemosHeader;
