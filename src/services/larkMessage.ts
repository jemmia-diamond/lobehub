import { toolsClient } from '@/libs/trpc/client';

class LarkMessageService {
  async findUser(params: { query: string }) {
    return toolsClient.larkMessage.findUser.query(params);
  }

  async getChats(params: { chatType?: 'p2p' | 'group' }) {
    return toolsClient.larkMessage.getChats.query(params);
  }

  async getMessages(params: { chatId: string; startTime?: number; endTime?: number }) {
    return toolsClient.larkMessage.getMessages.query(params);
  }
}

export const larkMessageService = new LarkMessageService();
