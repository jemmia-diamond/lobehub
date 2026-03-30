'use client';

import { ActionIcon, DropdownMenu } from '@lobehub/ui';
import { MoreHorizontalIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NavItem from '@/features/NavPanel/components/NavItem';

import { useTopicItemDropdownMenu } from '../../../agent/_layout/Sidebar/Topic/List/Item/useDropdownMenu';

interface RecentTopicItemProps {
  active?: boolean;
  id: string;
  title: string;
}

const RecentTopicItem = memo<RecentTopicItemProps>(({ id, title, active }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const toggleEditing = (visible?: boolean) => {
    setEditing(visible ?? !editing);
  };

  const { dropdownMenu } = useTopicItemDropdownMenu({
    id,
    toggleEditing,
  });

  return (
    <NavItem
      active={active}
      contextMenuItems={dropdownMenu}
      paddingInline={8}
      actions={
        <DropdownMenu items={dropdownMenu}>
          <ActionIcon icon={MoreHorizontalIcon} size={'small'} />
        </DropdownMenu>
      }
      title={
        <span
          style={{
            color: '#0A0A0A',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            fontStyle: 'normal',
            fontWeight: 400,
            letterSpacing: 'normal',
            lineHeight: '20px',
          }}
        >
          {title}
        </span>
      }
      onClick={() => {
        navigate(`/agent/inbox?topic=${id}`);
      }}
    />
  );
});

export default RecentTopicItem;
