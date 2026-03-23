import { memo } from 'react';

import { styles } from '../../styles';
import { type ListItem } from '../../types';
import { menuKey } from '../../utils';

interface JemmiaListItemRendererProps {
  activeKey: string;
  item: ListItem;
  onClose: () => void;
  onModelChange: (modelId: string, providerId: string) => void;
}

const MODEL_ICON_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'psychology',
  'gemini-2.5-flash-lite': 'bolt',
  'gemini-2.5-pro': 'school',
};

export const JemmiaListItemRenderer = memo<JemmiaListItemRendererProps>(
  ({ activeKey, item, onModelChange, onClose }) => {
    if (item.type !== 'provider-model-item') return null;

    const { model, provider } = item;
    const isActive = menuKey(provider.id, model.id) === activeKey;

    const icon = MODEL_ICON_MAP[model.id] || 'psychology';

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
        <span>
          {model.id === 'gemini-2.5-flash'
            ? 'Nghĩ Kỹ'
            : model.id === 'gemini-2.5-flash-lite'
              ? 'Làm Nhanh'
              : 'Chuyên Gia'}
        </span>

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
