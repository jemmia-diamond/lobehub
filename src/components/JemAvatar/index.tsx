import { createStyles } from 'antd-style';
import { memo } from 'react';

import JemLogo from '@/components/Branding/JemLogo';

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  `,
}));

interface JemAvatarProps {
  size?: number;
}

const JemAvatar = memo<JemAvatarProps>(({ size = 32 }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.container} style={{ height: size, width: size }}>
      <JemLogo size={Math.round(size * 0.8)} />
    </div>
  );
});

JemAvatar.displayName = 'JemAvatar';

export default JemAvatar;
