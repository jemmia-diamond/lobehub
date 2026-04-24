'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo, useEffect, useMemo, useRef } from 'react';
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

const useStyles = createStyles(({ css, token }) => ({
  sectionLabel: css`
    padding-block: 12px 8px;
    padding-inline: 0;

    font-family: Inter, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 400;
    font-style: normal;
    line-height: 16px;
    color: ${token.colorTextSecondary};
    letter-spacing: normal;
  `,
}));

const SectionLabel = memo<{ children: React.ReactNode }>(({ children }) => {
  const { styles } = useStyles();

  return (
    <Text ellipsis className={styles.sectionLabel}>
      {children}
    </Text>
  );
});

SectionLabel.displayName = 'SectionLabel';

const Body = memo(() => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const { showHomeTopicHistory, showAgentListSidebar } =
    useServerConfigStore(featureFlagsSelectors);
  const isLogin = useUserStore(authSelectors.isLogin);
  const recents = useHomeStore(homeRecentSelectors.recents);
  const isRecentsInit = useHomeStore(homeRecentSelectors.isRecentsInit);
  const hasMore = useHomeStore((s) => s.hasMore);
  const isLoadingMore = useHomeStore((s) => s.isLoadingMore);
  const loadMoreRecents = useHomeStore((s) => s.loadMoreRecents);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRecents(20);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [hasMore, isLoadingMore, loadMoreRecents]);

  const recentTopics = useMemo(() => recents?.filter((r) => r.type === 'topic'), [recents]);

  const activeTopicId = useChatStore((s) => s.activeTopicId);

  const hasRecentTopics = isRecentsInit && recentTopics && recentTopics.length > 0;

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
                    id={item.id}
                    key={item.id}
                    routePath={item.routePath}
                    title={item.title}
                  />
                ))}
              </Flexbox>
              {hasMore && (
                <Flexbox align={'center'} paddingBlock={8} ref={loadMoreRef}>
                  <Text
                    type={'secondary'}
                    style={{
                      fontSize: 12,
                      opacity: 0.5,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {isLoadingMore ? '...' : tCommon('loadMore')}
                  </Text>
                </Flexbox>
              )}
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