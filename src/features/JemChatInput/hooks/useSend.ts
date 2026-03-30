import { useCallback } from 'react';

import { useQueryRoute } from '@/hooks/useQueryRoute';
import { useAgentStore } from '@/store/agent';
import { builtinAgentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { fileChatSelectors, useFileStore } from '@/store/file';
import { useHomeStore } from '@/store/home';

interface UseSendProps {
  agentId?: string;
  threadId?: string | null;
  topicId?: string | null;
}

export const useSend = ({ agentId, threadId, topicId }: UseSendProps = {}) => {
  const router = useQueryRoute();
  const inboxAgentId = useAgentStore(builtinAgentSelectors.inboxAgentId);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearChatUploadFileList = useFileStore((s) => s.clearChatUploadFileList);
  const clearChatContextSelections = useFileStore((s) => s.clearChatContextSelections);

  const homeInputLoading = useHomeStore((s) => s.homeInputLoading);

  const send = useCallback(async () => {
    const { inputMessage, mainInputEditor } = useChatStore.getState();
    const fileStore = useFileStore.getState();
    const fileList = fileChatSelectors.chatUploadFileList(fileStore);
    const contextList = fileChatSelectors.chatContextSelections(fileStore);

    const { sendAsAgent, sendAsGroup, sendAsWrite, sendAsResearch, inputActiveMode } =
      useHomeStore.getState();

    // Require input content (except for default inbox which can have files/context)
    if (!inputMessage && fileList.length === 0 && contextList.length === 0) return;

    // Clear input and files immediately for responsive UX
    clearChatUploadFileList();
    clearChatContextSelections();
    mainInputEditor?.clearContent();

    const larkDocs = contextList
      .filter((c) => c.id.startsWith('lark-'))
      .map((c) => ({
        fileType: c.fileType,
        id: c.id,
        title: c.title || c.preview,
        url: c.url,
      }));

    try {
      // If we have an explicit agentId (Agent route), just send the message to that agent
      if (agentId) {
        await sendMessage({
          context: { agentId, threadId: threadId ?? undefined, topicId: topicId ?? undefined },
          contexts: contextList,
          files: fileList,
          message: inputMessage,
          metadata: larkDocs.length > 0 ? { larkDocs } : undefined,
        });
        return;
      }

      // Home route logic: handle different starter modes
      switch (inputActiveMode) {
        case 'agent': {
          await sendAsAgent(inputMessage);
          break;
        }

        case 'group': {
          await sendAsGroup(inputMessage);
          break;
        }

        case 'write': {
          await sendAsWrite(inputMessage);
          break;
        }

        case 'research': {
          await sendAsResearch(inputMessage);
          break;
        }

        default: {
          // Default inbox behavior from Home
          if (!inboxAgentId) return;

          await sendMessage({
            context: {
              agentId: inboxAgentId,
              threadId: threadId ?? undefined,
              topicId: topicId ?? undefined,
            },
            contexts: contextList,
            files: fileList,
            message: inputMessage,
            metadata: larkDocs.length > 0 ? { larkDocs } : undefined,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [
    agentId,
    inboxAgentId,
    sendMessage,
    threadId,
    topicId,
    clearChatContextSelections,
    clearChatUploadFileList,
    router,
  ]);

  return {
    inboxAgentId,
    loading: homeInputLoading,
    send,
  };
};
