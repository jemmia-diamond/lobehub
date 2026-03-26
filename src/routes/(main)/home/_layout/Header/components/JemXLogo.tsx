'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';

const JemXLogo = memo(() => {
  return (
    <Flexbox paddingBlock={8} paddingInline={8}>
      <Text
        fontSize={20}
        weight={800}
        style={{
          color: '#1D4ED8',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 800,
          letterSpacing: '-0.05em',
        }}
      >
        JemOS
      </Text>
      <Text
        fontSize={10}
        weight={700}
        style={{
          color: '#64748b',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        AI TRÊN ĐẦU NGÓN TAY
      </Text>
    </Flexbox>
  );
});

export default JemXLogo;
