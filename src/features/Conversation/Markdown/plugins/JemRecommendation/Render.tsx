'use client';

import { Flexbox, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Sparkles } from 'lucide-react';
import { memo } from 'react';

import { type MarkdownElementProps } from '../type';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;

    overflow: hidden;

    margin-block: 16px;
    padding: 16px;
    border: 1px solid ${token.colorInfoBorder};
    border-radius: ${token.borderRadiusLG}px;

    background: ${token.colorInfoBg};
  `,
  header: css`
    display: flex;
    gap: 8px;
    align-items: center;

    margin-block-end: 12px;

    font-size: 14px;
    font-weight: 700;
    color: ${token.colorInfoText};
  `,
  icon: css`
    color: ${token.colorInfo};
  `,
}));

const JemRecommendation = memo<MarkdownElementProps>(({ children }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon className={styles.icon} icon={Sparkles} size={16} />
        <span>DÀNH RIÊNG CHO BẠN</span>
      </div>
      <Flexbox gap={8}>{children}</Flexbox>
    </div>
  );
});

export default JemRecommendation;
