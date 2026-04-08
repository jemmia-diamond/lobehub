import { useCallback, useMemo } from 'react';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useAgentStore } from '@/store/agent';
import { agentByIdSelectors, builtinAgentSelectors } from '@/store/agent/selectors';

export type ThinkingMode = 'auto' | 'fast' | 'deep' | 'expert' | null;

export const useJemModeSelection = (agentId?: string) => {
  const enabledModels = useEnabledChatModels();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const targetId = agentId || inboxAgentId;

  const [model, provider] = useAgentStore((s) => [
    agentByIdSelectors.getAgentModelById(targetId)(s),
    agentByIdSelectors.getAgentModelProviderById(targetId)(s),
  ]);
  const updateAgentConfigById = useAgentStore((s) => s.updateAgentConfigById);

  const jem = useMemo(() => {
    if (!enabledModels || enabledModels.length === 0) return {};

    const jemModels = enabledModels.find((p) => p.id === 'jemmia')?.children || [];

    const auto = jemModels.find((m) => m.id === 'auto');
    const fast = jemModels.find((m) => m.id === 'gemini-2.5-flash-lite');
    const deep = jemModels.find((m) => m.id === 'gemini-2.5-flash');
    const expert = jemModels.find((m) => m.id === 'gemini-2.5-pro');

    return { auto, deep, expert, fast };
  }, [enabledModels]);

  const jemmiaList = useMemo(() => {
    if (!enabledModels) return [];

    const visibleModelIds = ['auto', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

    return enabledModels
      .filter((p) => p.id === 'jemmia')
      .map((p) => ({
        ...p,
        children: p.children.filter((m) => visibleModelIds.includes(m.id)),
      }))
      .filter((p) => p.children.length > 0);
  }, [enabledModels]);

  const thinkingMode: ThinkingMode = useMemo(() => {
    const { auto, fast, deep, expert } = jem as any;

    if (provider === 'jemmia') {
      if (auto && auto.id === model) return 'auto';
      if (fast && fast.id === model) return 'fast';
      if (deep && deep.id === model) return 'deep';
      if (expert && expert.id === model) return 'expert';
    }

    // Default to auto if not in jemmia or not a recognized jemmia model
    return 'auto';
  }, [jem, model, provider]);

  const handleModeChange = useCallback(
    (mode: ThinkingMode) => {
      if (!targetId || !mode) return;
      const { auto, fast, deep, expert } = jem as any;

      let target = auto;
      if (mode === 'fast' && fast) target = fast;
      if (mode === 'deep' && deep) target = deep;
      if (mode === 'expert' && expert) target = expert;

      if (!target) return;
      if (target.id === model && provider === 'jemmia') return;

      updateAgentConfigById(targetId, { model: target.id, provider: 'jemmia' });
    },
    [targetId, jem, model, provider, updateAgentConfigById],
  );

  return { handleModeChange, jemmiaList, model, provider, thinkingMode };
};
