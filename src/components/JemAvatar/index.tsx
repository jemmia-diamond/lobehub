import { createStyles } from 'antd-style';
import { memo } from 'react';

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background-color: #dbeafe;
  `,
}));

interface JemAvatarProps {
  size?: number;
}

const JemAvatar = memo<JemAvatarProps>(({ size = 32 }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.container} style={{ height: size, width: size }}>
      <span
        className="material-symbols-outlined"
        style={{
          color: '#171717',
          fontSize: Math.round(size * 0.6),
        }}
      >
        smart_toy
      </span>
    </div>
  );
});

JemAvatar.displayName = 'JemAvatar';

export default JemAvatar;
