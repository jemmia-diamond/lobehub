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
import { FastIcon, ThinkingIcon } from './JemIcons';

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

    const IconComponent = model.id === 'gemini-2.5-flash-lite' ? FastIcon : ThinkingIcon;

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
          <span
            className="material-symbols-outlined"
            style={{ color: '#0A0A0A', fontSize: 20, marginInlineStart: 'auto' }}
          >
            check
          </span>
        )}
      </button>
    );
  },
);

JemListItemRenderer.displayName = 'JemListItemRenderer';
