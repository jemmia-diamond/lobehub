import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    overflow: hidden;
    display: flex;
    flex-direction: column;

    min-width: 256px;
    max-height: 500px;
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowSecondary};
  `,
  detailPopup: css`
    width: 320px;
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowSecondary};
  `,
  footer: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  groupHeader: css`
    font-size: 12px;
    font-weight: 500;
    color: ${cssVar.colorTextDescription};
  `,
  jemmiaContainer: css`
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 4px;

    width: 327px;
    padding: 8px !important;
    border: 1px solid ${cssVar.colorBorder};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgElevated};
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 10%),
      0 2px 4px -2px rgb(0 0 0 / 10%);
  `,
  jemMenuDesc: css`
    font-size: 12px;
    line-height: 16px;
    color: #737373;
  `,
  jemMenuItem: css`
    cursor: pointer;

    display: flex;
    gap: 10px;
    align-items: center;

    width: 100%;
    padding-block: 8px;
    padding-inline: 10px;
    border: none;
    border-radius: 6px;

    background: transparent;
    outline: none;

    transition: background 0.2s;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }

    &:focus,
    &:active {
      outline: none;
    }
  `,
  jemMenuItemActive: css`
    background: ${cssVar.colorFillTertiary};
    outline: none;
    box-shadow: none;
  `,
  jemMenuTitle: css`
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: #0a0a0a;
  `,
  list: css`
    overflow-y: auto;
  `,
  menuItem: css`
    cursor: pointer;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  menuItemActive: css`
    background: ${cssVar.colorFillTertiary};
  `,
  toolbar: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  dropdownMenu: css`
    z-index: ${cssVar.zIndexPopupBase + 50};
  `,
  trigger: css`
    cursor: pointer;
  `,
}));
