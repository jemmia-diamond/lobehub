'use client';

import { Button } from 'antd';
import { Plus } from 'lucide-react';
import { memo, type ReactNode } from 'react';

interface NewConversationButtonProps {
  icon?: ReactNode;
  label?: string;
  onClick?: () => void;
}

const NewConversationButton = memo<NewConversationButtonProps>(({ icon, label, onClick }) => {
  return (
    <Button
      block
      size="large"
      type="primary"
      style={{
        alignItems: 'center',
        backgroundColor: '#1D4ED8',
        borderColor: '#1D4ED8',
        borderRadius: 12,
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        paddingBlock: 10,
        paddingInline: 16,
      }}
      onClick={onClick}
    >
      {icon ?? <Plus size={20} />}
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {label ?? 'Tạo hội thoại mới'}
      </span>
    </Button>
  );
});

export default NewConversationButton;
