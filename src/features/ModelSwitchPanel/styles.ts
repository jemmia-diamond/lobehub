import { createStaticStyles } from 'antd-style';

export const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    pointer-events: auto;
    user-select: none;
    overflow: hidden;
    padding: 0 !important;
  `,
  detailPopup: css`
    user-select: none;
    overscroll-behavior: contain;
    width: 400px;
  `,
  dropdownMenu: css`
    user-select: none;

    [role='menuitem'] {
      margin-block: 1px;
      margin-inline: 4px;
      padding-block: 8px;
      padding-inline: 8px;
      border-radius: ${cssVar.borderRadiusSM};
    }
  `,
  groupHeader: css`
    width: 100%;
    color: ${cssVar.colorTextSecondary};
  `,
  list: css`
    position: relative;
    overflow: hidden auto;
    overscroll-behavior: contain;
    width: 100%;
  `,
  menuItem: css`
    cursor: pointer;

    position: relative;

    gap: 8px;
    align-items: center;

    margin-block: 1px;
    margin-inline: 4px;
    padding-block: 8px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadiusSM};
  `,
  menuItemActive: css`
    background: ${cssVar.colorFillTertiary};
  `,
  footer: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  toolbar: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  trigger: css`
    display: inline-flex;
    outline: none;

    svg:focus {
      outline: none;
    }
  `,
  jemmiaContainer: css`
    pointer-events: auto;
    user-select: none;

    overflow: hidden;

    width: 192px;
    padding: 0 !important;
    border: 1px solid rgb(0 0 0 / 5%);
    border-radius: 12px;

    background: white;
  `,
  jemmiaMenuItem: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    padding-block: 10px;
    padding-inline: 16px;
    border: none;

    font-size: 14px;
    color: #374151;

    background: transparent;
    outline: none;

    transition: background 0.2s;

    &:hover {
      background: rgb(29 78 216 / 5%);
    }

    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: none;
    }
  `,
  jemmiaMenuItemActive: css`
    font-weight: 500;
    color: #1d4ed8;

    background: rgb(29 78 216 / 5%);
    outline: none;
    box-shadow: none;
  `,
}));
