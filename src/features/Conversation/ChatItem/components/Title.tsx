import { Text } from '@lobehub/ui';
import dayjs from 'dayjs';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { styles } from '../style';
import { type ChatItemProps } from '../type';

export interface TitleProps {
  avatar: ChatItemProps['avatar'];
  isAgent?: boolean;
  showTitle?: ChatItemProps['showTitle'];
  time?: ChatItemProps['time'];
  titleAddon?: ChatItemProps['titleAddon'];
}

const Title = memo<TitleProps>(({ showTitle, time, avatar, titleAddon, isAgent }) => {
  const { t } = useTranslation('chat');
  const title = avatar.title || t('untitledAgent');

  return (
    <>
      {showTitle && (
        <Text
          className={isAgent ? styles.agentName : undefined}
          data-testid="chat-item-title"
          fontSize={14}
          weight={500}
        >
          {title}
        </Text>
      )}
      {showTitle ? titleAddon : undefined}
      {!time ? null : (
        <Text
          aria-label="published-date"
          as={'time'}
          fontSize={12}
          title={dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          type={'secondary'}
        >
          {dayjs(time).fromNow()}
        </Text>
      )}
    </>
  );
});

export default Title;
