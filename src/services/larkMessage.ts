import { toolsClient } from '@/libs/trpc/client';

class LarkMessageService {
  async searchEmployees(params: { pageSize?: number; pageToken?: string; query?: string }) {
    return toolsClient.larkMessage.searchEmployees.query(params);
  }

  async getChats(params: {
    pageSize?: number;
    pageToken?: string;
    sortType?: string;
    userIdType?: string;
  }) {
    return toolsClient.larkMessage.getChats.query(params);
  }

  async getMessages(params: { chatId: string; startTime?: number; endTime?: number }) {
    return toolsClient.larkMessage.getMessages.query(params);
  }
}

export const larkMessageService = new LarkMessageService();
