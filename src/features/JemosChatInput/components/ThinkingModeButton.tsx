'use client';

import { Dropdown, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronDown } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { type ThinkingMode, useJemmiaModeSelection } from '@/hooks/useJemmiaModeSelection';

const useStyles = createStyles(({ css }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;
    border-radius: 8px;

    color: #fff;

    background: #1d4ed8;

    transition: all 0.2s ease-in-out;

    &:hover {
      background: #1e40af;
    }
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  text: css`
    font-size: 13px;
    font-weight: 600;
  `,
}));

interface ModeConfig {
  icon: string;
  labelKey: string;
}

const modeConfigs: Record<Exclude<ThinkingMode, null>, ModeConfig> = {
  deep: { icon: 'psychology', labelKey: 'thinkingMode.deep.title' },
  expert: { icon: 'school', labelKey: 'thinkingMode.expert.title' },
  fast: { icon: 'bolt', labelKey: 'thinkingMode.fast.title' },
};

const ThinkingModeButton = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const { thinkingMode, handleModeChange } = useJemmiaModeSelection();

  const currentMode = thinkingMode || 'deep';
  const config = modeConfigs[currentMode];

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        icon: (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            bolt
          </span>
        ),
        key: 'fast',
        label: t('thinkingMode.fast.title'),
      },
      {
        icon: (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            psychology
          </span>
        ),
        key: 'deep',
        label: t('thinkingMode.deep.title'),
      },
      {
        icon: (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            school
          </span>
        ),
        key: 'expert',
        label: t('thinkingMode.expert.title'),
      },
    ],
    [t],
  );

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    handleModeChange(key as Exclude<ThinkingMode, null>);
  };

  return (
    <Dropdown
      menu={{ items, onClick: onMenuClick, selectedKeys: [currentMode] }}
      trigger={['hover', 'click']}
    >
      <div className={styles.button}>
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {config.icon}
          </span>
        </div>
        <span className={styles.text}>{t(config.labelKey as any)}</span>
        <ChevronDown size={14} />
      </div>
    </Dropdown>
  );
});

export default ThinkingModeButton;
