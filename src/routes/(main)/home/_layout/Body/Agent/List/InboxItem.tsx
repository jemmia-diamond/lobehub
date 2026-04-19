'use client';

import { SESSION_CHAT_URL } from '@lobechat/const';
import { type CSSProperties, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import NavItem from '@/features/NavPanel/components/NavItem';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';

interface InboxItemProps {
  className?: string;
  style?: CSSProperties;
}

const SmartToyIcon = memo(() => (
  <span
    className="material-symbols-outlined"
    style={{
      color: '#171717',
      fontSize: 18,
    }}
  >
    smart_toy
  </span>
));

SmartToyIcon.displayName = 'SmartToyIcon';

const InboxItem = memo<InboxItemProps>(({ className, style }) => {
  const { t } = useTranslation('home');
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const isLoading = useChatStore(operationSelectors.isAgentRuntimeRunning);
  const inboxAgentTitle = 'Brainy';

  return (
    <Link aria-label={inboxAgentTitle} to={SESSION_CHAT_URL(inboxAgentId, false)}>
      <NavItem
        className={className}
        icon={<SmartToyIcon />}
        loading={isLoading}
        paddingInline={8}
        extra={
          <span
            style={{
              backgroundColor: '#dbeafe',
              borderRadius: 4,
              color: '#171717',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '18px',
              paddingBlock: '2px',
              paddingInline: '6px',
              textTransform: 'uppercase',
            }}
          >
            {t('sidebar.defaultBadge')}
          </span>
        }
        style={{
          ...style,
          backgroundColor: '#fff',
          borderRadius: 6,
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
          color: '#171717',
        }}
        title={
          <span style={{ color: '#171717', fontSize: 12, fontWeight: 700 }}>{inboxAgentTitle}</span>
        }
      />
    </Link>
  );
});

export default InboxItem;