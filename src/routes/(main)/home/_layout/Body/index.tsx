'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import NavItem from '@/features/NavPanel/components/NavItem';
import { useHomeStore } from '@/store/home';
import { homeRecentSelectors } from '@/store/home/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import Agent from './Agent';

const SectionLabel = memo<{ children: React.ReactNode }>(({ children }) => (
  <Text
    ellipsis
    style={{
      color: '#64748b',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      paddingBlock: '12px 8px',
      paddingInline: 10,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </Text>
));

SectionLabel.displayName = 'SectionLabel';

const Body = memo(() => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const { showHomeTopicHistory, showAgentListSidebar } =
    useServerConfigStore(featureFlagsSelectors);
  const isLogin = useUserStore(authSelectors.isLogin);
  const recentTopics = useHomeStore(homeRecentSelectors.recentTopics);
  const isRecentTopicsInit = useHomeStore(homeRecentSelectors.isRecentTopicsInit);
  const hasRecentTopics = isRecentTopicsInit && recentTopics && recentTopics.length > 0;

  return (
    <Flexbox flex={1} paddingInline={4} style={{ overflowY: 'auto' }}>
      {/* Agents section — always above history */}
      {showAgentListSidebar && (
        <Flexbox>
          <SectionLabel>{t('sidebar.yourAssistants')}</SectionLabel>
          <Agent />
        </Flexbox>
      )}

      {/* History section */}
      {showHomeTopicHistory && isLogin && hasRecentTopics && (
        <Flexbox>
          <SectionLabel>{t('sidebar.history')}</SectionLabel>
          <Flexbox gap={1} paddingBlock={1}>
            {recentTopics.map((topic) => {
              const topicUrl =
                topic.type === 'group' && topic.group
                  ? `/group/${topic.group.id}?topic=${topic.id}`
                  : `/agent/${topic.agent?.id}?topic=${topic.id}`;

              const displayTitle = topic.title || topic.group?.title || topic.agent?.title || '';

              return (
                <Link
                  key={topic.id}
                  to={topicUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(topicUrl);
                  }}
                >
                  <NavItem style={{ paddingInlineStart: 8 }} title={displayTitle} />
                </Link>
              );
            })}
          </Flexbox>
        </Flexbox>
      )}
    </Flexbox>
  );
});

export default Body;
