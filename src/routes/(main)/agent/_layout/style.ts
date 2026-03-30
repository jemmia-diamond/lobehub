import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  absoluteContainer: css`
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: ${cssVar.colorBgLayout};
  `,

  contentDark: css`
    overflow: hidden;
    background: linear-gradient(
      to bottom,
      ${cssVar.colorBgContainer},
      var(--content-bg-secondary, ${cssVar.colorBgContainer})
    );
  `,

  contentLight: css`
    overflow: hidden;
    flex: 1;

    width: 100%;
    height: 100%;

    background: ${cssVar.colorBgContainer};
  `,
}));
