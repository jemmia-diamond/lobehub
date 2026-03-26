import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  JEMMIA_MODEL_ICON_MAP,
  JEMMIA_MODEL_LABEL_KEYS,
} from '../../../ChatInput/ActionBar/Model/constants';
import { styles } from '../../styles';
import { type ListItem } from '../../types';
import { menuKey } from '../../utils';

interface JemmiaListItemRendererProps {
  activeKey: string;
  item: ListItem;
  onClose: () => void;
  onModelChange: (modelId: string, providerId: string) => void;
}

export const JemmiaListItemRenderer = memo<JemmiaListItemRendererProps>(
  ({ activeKey, item, onModelChange, onClose }) => {
    const { t } = useTranslation('chat');
    if (item.type !== 'provider-model-item') return null;

    const { model, provider } = item;
    const isActive = menuKey(provider.id, model.id) === activeKey;

    const icon = JEMMIA_MODEL_ICON_MAP[model.id] || 'psychology';

    return (
      <button
        className={`${styles.jemmiaMenuItem} ${isActive ? styles.jemmiaMenuItemActive : ''}`}
        type="button"
        onClick={() => {
          onModelChange(model.id, provider.id);
          onClose();
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {icon}
        </span>
        <span>{t(JEMMIA_MODEL_LABEL_KEYS[model.id] as any)}</span>

        {isActive && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, marginInlineStart: 'auto' }}
          >
            check
          </span>
        )}
      </button>
    );
  },
);

JemmiaListItemRenderer.displayName = 'JemmiaListItemRenderer';
