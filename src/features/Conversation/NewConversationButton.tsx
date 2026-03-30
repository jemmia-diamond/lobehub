'use client';

import { Button } from 'antd';
import { Plus } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

interface NewConversationButtonProps {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
}

const NewConversationButton = memo<NewConversationButtonProps>(({ icon, label, onClick }) => {
  const { t } = useTranslation('chat');
  const expand = useGlobalStore((s) => systemStatusSelectors.showLeftPanel(s));

  return (
    <Button
      block
      style={{
        alignItems: 'center',
        backgroundColor: '#171717',
        border: 'none',
        borderRadius: 10,
        boxShadow: '0px 1px 2px 0px #0000001A',
        color: '#fff',
        display: 'flex',
        gap: expand ? 6 : 0,
        height: 40,
        justifyContent: 'center',
        marginInline: 'auto',
        paddingBlock: 0,
        paddingInline: expand ? 10 : 0,
        width: expand ? '100%' : 40,
      }}
      onClick={onClick}
    >
      {icon ?? <Plus size={expand ? 16 : 20} />}
      {expand && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {label ?? t('newChat')}
        </span>
      )}
    </Button>
  );
});

export default NewConversationButton;
