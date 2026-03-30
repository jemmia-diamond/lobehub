import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  // 绝对定位容器，占满父容器
  absoluteContainer: css`
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: ${cssVar.colorBgLayout};
  `,

  absoluteContainerDark: css`
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #171717;
  `,

  // Inner Card layout
  card: css`
    overflow: hidden;
    flex: 1;

    width: 100%;
    height: 100%;

    background: ${cssVar.colorBgContainer};
  `,

  cardDark: css`
    overflow: hidden;
    flex: 1;

    height: calc(100% - 16px);
    margin-block: 8px;
    margin-inline: 0 8px;
    border: 1px solid #404040;
    border-radius: 14px;

    background: #262626;
  `,

  main: css`
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
  `,
}));
