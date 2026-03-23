import { toolsClient } from '@/libs/trpc/client';

class LarkDocService {
  async getDocContent(params: { documentId: string }) {
    return toolsClient.larkDoc.getDocContent.query(params);
  }

  async getDocMeta(params: { documentId: string }) {
    return toolsClient.larkDoc.getDocMeta.query(params);
  }

  async listDocs(params: { folderToken?: string }) {
    return toolsClient.larkDoc.listDocs.query(params);
  }

  async searchDocs(params: { query: string; page?: number }) {
    return toolsClient.larkDoc.searchDocs.query(params);
  }
}

export const larkDocService = new LarkDocService();
