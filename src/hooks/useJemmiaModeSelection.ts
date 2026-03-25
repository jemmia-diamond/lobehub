import { useCallback, useMemo } from 'react';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, builtinAgentSelectors } from '@/store/agent/selectors';

export type ThinkingMode = 'fast' | 'deep' | 'expert' | null;

export const useJemmiaModeSelection = (agentId?: string) => {
  const enabledModels = useEnabledChatModels();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const targetId = agentId || inboxAgentId;

  const [model, provider] = useAgentStore((s) => [
    agentByIdSelectors.getAgentModelById(targetId)(s),
    agentByIdSelectors.getAgentModelProviderById(targetId)(s),
  ]);
  const updateAgentConfigById = useAgentStore((s) => s.updateAgentConfigById);

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
      if (!targetId) return;
      const { fast, deep, expert } = jemmia as any;

      let target = deep;
      if (mode === 'fast' && fast) target = fast;
      if (mode === 'expert' && expert) target = expert;

      if (!target) return;
      if (target.id === model && target.provider === provider) return;

      updateAgentConfigById(targetId, { model: target.id, provider: target.provider });
    },
    [targetId, jemmia, model, provider, updateAgentConfigById],
  );

  return { handleModeChange, thinkingMode };
};
