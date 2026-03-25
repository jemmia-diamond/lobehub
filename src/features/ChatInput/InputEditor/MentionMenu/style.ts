import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  backHeader: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;

    font-size: 13px;
    font-weight: 500;
    color: ${token.colorTextSecondary};

    &:hover {
      color: ${token.colorText};
    }
  `,
  categoryExtra: css`
    display: flex;
    flex-shrink: 0;
    gap: 2px;
    align-items: center;

    font-size: 12px;
    color: ${token.colorTextQuaternary};
  `,
  container: css`
    position: fixed;
    z-index: 99999;

    display: flex;
    flex-direction: column;

    min-width: 260px;
    max-width: 360px;
    max-height: 360px;
    padding: 4px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;

    background: ${isDarkMode ? token.colorBgElevated : token.colorBgContainer};
    box-shadow: ${token.boxShadowSecondary};
  `,
  divider: css`
    height: 1px;
    margin-block: 4px;
    margin-inline: 8px;
    background: ${token.colorBorder};
  `,
  empty: css`
    padding-block: 16px;
    padding-inline: 12px;

    font-size: 13px;
    color: ${token.colorTextQuaternary};
    text-align: center;
  `,
  item: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;
    border-radius: 6px;

    font-size: 13px;

    transition: background 0.1s;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  itemActive: css`
    background: ${token.colorFillSecondary};
  `,
  itemIcon: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
  `,
  itemLabel: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  `,
  itemLabelTitle: css`
    overflow: hidden;

    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    color: ${token.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  itemDescription: css`
    overflow: hidden;

    font-size: 11px;
    line-height: 1.2;
    color: ${token.colorTextDescription};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  itemContent: css`
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;

    min-width: 0;
  `,
  categoryTitle: css`
    padding-block: 10px 6px;
    padding-inline: 12px;

    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  scrollArea: css`
    overflow-y: auto;
    flex: 1;
  `,
}));
