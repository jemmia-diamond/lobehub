'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';
import { useHomeStore } from '@/store/home';
import { homeRecentSelectors } from '@/store/home/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import Agent from './Agent';
import BottomMenu from './BottomMenu';
import HistoryEmpty from './HistoryEmpty';
import RecentTopicItem from './RecentTopicItem';

const SectionLabel = memo<{ children: React.ReactNode }>(({ children }) => (
  <Text
    ellipsis
    style={{
      color: '#0A0A0A',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      fontStyle: 'normal',
      fontWeight: 400,
      letterSpacing: 'normal',
      lineHeight: '16px',
      paddingBlock: '12px 8px',
      paddingInline: 0,
    }}
  >
    {children}
  </Text>
));

SectionLabel.displayName = 'SectionLabel';

const Body = memo(() => {
  const { t } = useTranslation('home');
  const { showHomeTopicHistory, showAgentListSidebar } =
    useServerConfigStore(featureFlagsSelectors);
  const isLogin = useUserStore(authSelectors.isLogin);
  const recentTopics = useHomeStore(homeRecentSelectors.recentTopics);
  const isRecentTopicsInit = useHomeStore(homeRecentSelectors.isRecentTopicsInit);

  const activeTopicId = useChatStore((s) => s.activeTopicId);

  const hasRecentTopics = isRecentTopicsInit && recentTopics && recentTopics.length > 0;

  return (
    <Flexbox
      flex={1}
      gap={8}
      paddingInline={12}
      style={{
        overflowX: 'hidden',
        overflowY: 'auto',
        paddingRight: 4,
      }}
    >
      {/* Agents section — always above history */}
      {showAgentListSidebar && (
        <Flexbox>
          <SectionLabel>{t('sidebar.yourAssistants')}</SectionLabel>
          <Agent />
        </Flexbox>
      )}

      {/* History section */}
      {showHomeTopicHistory && isLogin && (
        <Flexbox flex={!hasRecentTopics ? 1 : undefined}>
          {hasRecentTopics ? (
            <>
              <SectionLabel>{t('sidebar.history')}</SectionLabel>
              <Flexbox align={'stretch'} gap={1} paddingBlock={1} width={'100%'}>
                {recentTopics?.map((item: any) => (
                  <RecentTopicItem
                    active={activeTopicId === item.id}
                    agent={item.agent}
                    group={item.group}
                    id={item.id}
                    key={item.id}
                    title={item.title}
                    type={item.type}
                  />
                ))}
              </Flexbox>
            </>
          ) : (
            <HistoryEmpty />
          )}
        </Flexbox>
      )}

      {/* Bottom Menu: Market, Settings, etc. */}
      {isLogin && <BottomMenu />}
    </Flexbox>
  );
});

export default Body;
