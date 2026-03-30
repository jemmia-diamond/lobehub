'use client';

import { createStyles } from 'antd-style';
import { ChevronDown } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ModelSwitchPanel from '@/features/ModelSwitchPanel';
import { useJemModeSelection } from '@/hooks/useJemModeSelection';

const useStyles = createStyles(({ css }) => ({
  button: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 6px;
    padding-inline: 12px;
    border: var(--border-width, 1px) solid var(--border, #e5e5e5);
    border-radius: var(--rounded-lg, 8px);

    color: #171717;

    background: var(--background, #fff);
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 10%);

    transition: all 0.2s ease-in-out;

    &:hover {
      background: #f5f5f5;
    }
  `,
  text: css`
    font-size: 13px;
    font-weight: 600;
  `,
}));

const ThinkingModeButton = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('home');
  const { thinkingMode, jemmiaList, model, provider } = useJemModeSelection();

  return (
    <ModelSwitchPanel
      openOnHover
      enabledList={jemmiaList}
      model={model}
      placement="bottomRight"
      provider={provider}
      variant="jemmia"
    >
      <div className={styles.button}>
        <span className={styles.text}>
          {t(`thinkingMode.${thinkingMode || 'deep'}.title` as any)}
        </span>
        <ChevronDown size={14} />
      </div>
    </ModelSwitchPanel>
  );
});

export default ThinkingModeButton;
