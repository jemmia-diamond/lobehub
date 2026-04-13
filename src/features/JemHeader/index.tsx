import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import NavHeader from '@/features/NavHeader';

interface JemHeaderProps {
  children?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

const JemHeader = memo<JemHeaderProps>(({ left, right, children }) => {
  return (
    <NavHeader
      left={
        left || (
          <span
            style={{
              paddingLeft: 16,
              color: '#171717',
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            Brainy
          </span>
        )
      }
      right={
        right || (
          <Flexbox horizontal align="center">
            {/* Standard right side actions can go here */}
          </Flexbox>
        )
      }
      style={{
        backdropFilter: 'blur(24px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid rgba(169, 180, 185, 0.1)',
      }}
    >
      {children}
    </NavHeader>
  );
});

JemHeader.displayName = 'JemHeader';

export default JemHeader;
