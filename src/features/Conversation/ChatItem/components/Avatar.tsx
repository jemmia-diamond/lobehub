import { Avatar as A } from '@lobehub/ui';
import { type CSSProperties, memo } from 'react';

import JemosAvatar from '@/components/JemosAvatar';
import { DEFAULT_INBOX_AVATAR } from '@/const/meta';

import { type ChatItemProps } from '../type';

export interface AvatarProps {
  alt?: string;
  avatar: ChatItemProps['avatar'];
  loading?: boolean;
  onClick?: ChatItemProps['onAvatarClick'];
  size?: number;
  style?: CSSProperties;
  unoptimized?: boolean;
}

const Avatar = memo<AvatarProps>(
  ({ loading, avatar, unoptimized, onClick, size = 28, style, alt }) => {
    if (avatar.avatar === DEFAULT_INBOX_AVATAR) {
      return <JemosAvatar size={size} />;
    }

    return (
      <A
        alt={alt || avatar.title}
        animation={loading}
        avatar={avatar.avatar}
        background={avatar.backgroundColor}
        shape={'square'}
        size={size}
        style={style}
        title={avatar.title}
        unoptimized={unoptimized}
        onClick={onClick}
      />
    );
  },
);

export default Avatar;
