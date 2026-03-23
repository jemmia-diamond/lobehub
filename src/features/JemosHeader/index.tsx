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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(169, 180, 185, 0.1)',
        flexShrink: 0,
        height: 44,
        paddingInline: 16,
        width: '100%',
        zIndex: 10,
      }}
    >
      <Flexbox horizontal align="center" gap={16}>
        {left || (
          <span
            style={{
              color: '#1D4ED8',
              fontSize: 16,
              fontWeight: 800,
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
