'use client';

import { Center, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import EmptyIcon from '@/components/EmptyIcon';

const HistoryEmpty = memo(() => {
  const { t } = useTranslation('home');

  return (
    <Center
      gap={12}
      paddingBlock={8}
      paddingInline={12}
      style={{ color: '#A1A1A1', flex: 1, minHeight: 200 }}
    >
      <EmptyIcon />
      <Text align={'center'} fontSize={12} style={{ color: 'inherit', lineHeight: '16px' }}>
        {t('sidebar.noHistory')}
      </Text>
    </Center>
  );
});

HistoryEmpty.displayName = 'HistoryEmpty';

export default HistoryEmpty;
