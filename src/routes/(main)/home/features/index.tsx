'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { useHomeStore } from '@/store/home';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

import HomeHeader from './HomeHeader';
import InputArea from './InputArea';
import ModeSelection from './ModeSelection';
import RecentPage from './RecentPage';
import RecentResource from './RecentResource';
import RecentTopic from './RecentTopic';

type ThinkingMode = 'fast' | 'deep' | 'expert' | null;

const Home = memo(() => {
  useTranslation();
  const isLogin = useUserStore(authSelectors.isLogin);
  const inputActiveMode = useHomeStore((s) => s.inputActiveMode);

  const enabledModels = useEnabledChatModels();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const [model, provider] = useAgentStore((s) => [
    agentByIdSelectors.getAgentModelById(inboxAgentId)(s),
    agentByIdSelectors.getAgentModelProviderById(inboxAgentId)(s),
  ]);
  const updateAgentConfigById = useAgentStore((s) => s.updateAgentConfigById);
  const { showHomeRecentTopic, showHomeRecentPage } = useServerConfigStore(featureFlagsSelectors);

  const jemmia = useMemo(() => {
    if (!enabledModels || enabledModels.length === 0) return {};

    const all = enabledModels.flatMap((p) =>
      p.children.map((m) => ({
        ...m,
        provider: p.id,
      })),
    );

    const fast = all.find((m) => m.displayName === 'Jemmia Làm nhanh');
    const deep = all.find((m) => m.displayName === 'Jemmia Nghĩ kỹ');
    const expert = all.find((m) => m.displayName === 'Jemmia Chuyên gia');

    return { fast, deep, expert };
  }, [enabledModels]);

  const thinkingMode: ThinkingMode = useMemo(() => {
    const { fast, deep, expert } = jemmia as any;
    if (!model) return deep ? 'deep' : null;

    if (fast && fast.id === model && fast.provider === provider) return 'fast';
    if (deep && deep.id === model && deep.provider === provider) return 'deep';
    if (expert && expert.id === model && expert.provider === provider) return 'expert';

    return deep ? 'deep' : null;
  }, [jemmia, model, provider]);

  const handleModeChange = useCallback(
    (mode: Exclude<ThinkingMode, null>) => {
      if (!inboxAgentId) return;
      const { fast, deep, expert } = jemmia as any;

      let target = deep;
      if (mode === 'fast' && fast) target = fast;
      if (mode === 'expert' && expert) target = expert;

      if (!target) return;
      if (target.id === model && target.provider === provider) return;

      updateAgentConfigById(inboxAgentId, { model: target.id, provider: target.provider });
    },
    [inboxAgentId, jemmia, model, provider, updateAgentConfigById],
  );

  const hideOtherModules = inputActiveMode && ['agent', 'group', 'write'].includes(inputActiveMode);

  return (
    <Flexbox gap={40}>
      <HomeHeader />
      <ModeSelection activeMode={thinkingMode} onChangeMode={handleModeChange} />
      <InputArea />
      <Flexbox gap={40} style={{ display: hideOtherModules ? 'none' : undefined }}>
        {isLogin && (
          <>
            {showHomeRecentTopic && <RecentTopic />}
            {showHomeRecentPage && <RecentPage />}
          </>
        )}
        {isLogin && <RecentResource />}
      </Flexbox>
    </Flexbox>
  );
});

export default Home;
