'use client';

import { type RecentTopicAgent, type RecentTopicGroup } from '@lobechat/types';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NavItem from '@/features/NavPanel/components/NavItem';

import { useTopicItemDropdownMenu } from '../../../agent/_layout/Sidebar/Topic/List/Item/useDropdownMenu';

interface RecentTopicItemProps {
  active?: boolean;
  agent?: RecentTopicAgent | null;
  group?: RecentTopicGroup | null;
  id: string;
  routePath?: string;
  title: string;
  type?: string;
}

const RecentTopicItem = memo<RecentTopicItemProps>(
  ({ id, title, active, agent, group, routePath }) => {
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);

    const toggleEditing = (visible?: boolean) => {
      setEditing(visible ?? !editing);
    };

    const { dropdownMenu } = useTopicItemDropdownMenu({
      id,
      toggleEditing,
    });

    const displayTitle = title || group?.title || agent?.title || '';

    return (
      <NavItem
        active={active}
        contextMenuItems={dropdownMenu}
        paddingInline={8}
        title={displayTitle}
        style={{
          marginRight: 8,
          backgroundColor: active ? '#E4E2DB' : undefined,
        }}
        onClick={() => {
          if (routePath) {
            navigate(routePath);
          }
        }}
      />
    );
  },
);

export default RecentTopicItem;
