import { Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { shinyTextStyles } from '@/styles';

import StatusIndicator from './StatusIndicator';

interface ThinkingTitleProps {
  duration?: number;
  showDetail?: boolean;
  thinking?: boolean;
}

const ThinkingTitle = memo<ThinkingTitleProps>(({ showDetail, thinking, duration }) => {
  const { t } = useTranslation('components');

  return (
    <Flexbox horizontal align={'center'} gap={6}>
      <StatusIndicator showDetail={showDetail} thinking={thinking} />
      {thinking ? (
        <span
          className={shinyTextStyles.shinyText}
          style={{
            color: '#171717',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {t('Thinking.thinking')}
        </span>
      ) : (
        <Text style={{ fontSize: 13, fontWeight: 500 }} type={'secondary'}>
          {!duration
            ? t('Thinking.thoughtWithDuration')
            : t('Thinking.thought', { duration: ((duration || 0) / 1000).toFixed(1) })}
        </Text>
      )}
    </Flexbox>
  );
});

export default ThinkingTitle;
