'use client';

import { Dropdown, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronDown, type LucideIcon, Rocket, Sparkles, Zap } from 'lucide-react';
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
  icon: LucideIcon;
  labelKey: string;
}

const modeConfigs: Record<Exclude<ThinkingMode, null>, ModeConfig> = {
  deep: { icon: Sparkles, labelKey: 'thinkingMode.deep.title' },
  expert: { icon: Rocket, labelKey: 'thinkingMode.expert.title' },
  fast: { icon: Zap, labelKey: 'thinkingMode.fast.title' },
};

const ThinkingModeButton = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const { thinkingMode, handleModeChange } = useJemmiaModeSelection();

  const currentMode = thinkingMode || 'deep';
  const config = modeConfigs[currentMode];
  const Icon = config.icon;

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        icon: <Zap size={16} />,
        key: 'fast',
        label: t('thinkingMode.fast.title'),
      },
      {
        icon: <Sparkles size={16} />,
        key: 'deep',
        label: t('thinkingMode.deep.title'),
      },
      {
        icon: <Rocket size={16} />,
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
          <Icon size={16} />
        </div>
        <span className={styles.text}>{t(config.labelKey as any)}</span>
        <ChevronDown size={14} />
      </div>
    </Dropdown>
  );
});

export default ThinkingModeButton;
