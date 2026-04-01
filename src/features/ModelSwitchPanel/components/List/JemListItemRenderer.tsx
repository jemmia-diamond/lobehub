import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  JEMMIA_MODEL_DESC_KEYS,
  JEMMIA_MODEL_LABEL_KEYS,
} from '@/features/ChatInput/ActionBar/Model/constants';

import { styles } from '../../styles';
import { type ListItem } from '../../types';
import { menuKey } from '../../utils';
import { AutoIcon, FastIcon, ThinkingIcon } from './JemIcons';

interface JemListItemRendererProps {
  activeKey: string;
  item: ListItem;
  onClose: () => void;
  onModelChange: (modelId: string, providerId: string) => void;
}

export const JemListItemRenderer = memo<JemListItemRendererProps>(
  ({ activeKey, item, onModelChange, onClose }) => {
    const { t } = useTranslation('home');
    if (item.type !== 'provider-model-item') return null;

    const { model, provider } = item;
    const isActive = menuKey(provider.id, model.id) === activeKey;

    const labelKey = JEMMIA_MODEL_LABEL_KEYS[model.id];
    const descKey = JEMMIA_MODEL_DESC_KEYS[model.id];

    let IconComponent = ThinkingIcon;
    if (model.id === 'gemini-2.5-flash-lite') IconComponent = FastIcon;
    if (model.id === 'auto') IconComponent = AutoIcon;

    return (
      <button
        className={`${styles.jemMenuItem} ${isActive ? styles.jemMenuItemActive : ''}`}
        type="button"
        onClick={() => {
          onModelChange(model.id, provider.id);
          onClose();
        }}
      >
        <div style={{ flex: 'none', height: 24, width: 24 }}>
          <IconComponent />
        </div>
        <Flexbox flex={1} gap={2} style={{ textAlign: 'left' }}>
          <div className={styles.jemMenuTitle}>{t(labelKey as any)}</div>
          <div className={styles.jemMenuDesc}>{t(descKey as any)}</div>
        </Flexbox>

        {isActive && (
          <svg
            fill="none"
            height="20"
            style={{ marginInlineStart: 'auto' }}
            viewBox="0 0 20 20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.16667 9.99992L8.33333 14.1666L16.6667 5.83325"
              stroke="#171717"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>
    );
  },
);

JemListItemRenderer.displayName = 'JemListItemRenderer';
