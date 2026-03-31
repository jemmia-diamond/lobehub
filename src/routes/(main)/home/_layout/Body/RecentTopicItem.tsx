'use client';

import { type RecentTopicAgent, type RecentTopicGroup } from '@lobechat/types';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NavItem from '@/features/NavPanel/components/NavItem';

import { useTopicItemDropdownMenu } from '../../../agent/_layout/Sidebar/Topic/List/Item/useDropdownMenu';

interface RecentTopicItemProps {
  active?: boolean;
  agent: RecentTopicAgent | null;
  group: RecentTopicGroup | null;
  id: string;
  title: string;
  type: 'agent' | 'group';
}

const RecentTopicItem = memo<RecentTopicItemProps>(({ id, title, active, type, agent, group }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const toggleEditing = (visible?: boolean) => {
    setEditing(visible ?? !editing);
  };

  const { dropdownMenu } = useTopicItemDropdownMenu({
    id,
    toggleEditing,
  });

  const topicUrl =
    type === 'group' && group
      ? `/group/${group.id}?topic=${id}`
      : `/agent/${agent?.id}?topic=${id}`;

  const displayTitle = title || group?.title || agent?.title || '';

  return (
    <NavItem
      active={active}
      contextMenuItems={dropdownMenu}
      paddingInline={8}
      /**
       actions={
        <DropdownMenu items={dropdownMenu}>
          <ActionIcon icon={MoreHorizontalIcon} size={'small'} />
        </DropdownMenu>
      }
       */
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
          {displayTitle}
        </span>
      }
      onClick={() => {
        navigate(topicUrl);
      }}
    />
  );
});

export default RecentTopicItem;
