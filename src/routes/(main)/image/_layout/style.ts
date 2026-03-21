import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css }) => ({
  contentContainer: css`
    min-height: 100%;
  `,
  mainContainer: css`
    overflow-y: auto;
  `,
}));
