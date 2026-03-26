import { useUnmount } from 'ahooks';
import { createStoreUpdater } from 'zustand-utils';

import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';

/**
 * Sync inbox agent id to activeAgentId when on home page.
 * This component should only be rendered when isHomeRoute is true.
 */
const HomeAgentIdSync = () => {
  const useAgentStoreUpdater = createStoreUpdater(useAgentStore);
  const useChatStoreUpdater = createStoreUpdater(useChatStore);

  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);

  // Sync inbox agent id to activeAgentId when on home page
  useAgentStoreUpdater('activeAgentId', inboxAgentId);
  useChatStoreUpdater('activeAgentId', inboxAgentId);

  // Clear activeAgentId when unmounting (leaving home page)
  useUnmount(() => {
    useAgentStore.setState({ activeAgentId: undefined });
    useChatStore.setState({ activeAgentId: '' });
  });

  return null;
};

export default HomeAgentIdSync;
