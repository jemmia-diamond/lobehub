import { toolsClient } from '@/libs/trpc/client';

class LarkDocService {
  async getDocContent(params: { documentId: string }) {
    return toolsClient.larkDoc.getDocContent.query(params);
  }

  async getDocMeta(params: { documentId: string }) {
    return toolsClient.larkDoc.getDocMeta.query(params);
  }

  async searchDocs(params: { searchKey: string; count?: number; offset?: number; docsTypes?: string[] }) {
    return toolsClient.larkDoc.searchDocs.query(params);
  }

  async searchWiki(params: {
    pageSize?: number;
    pageToken?: string;
    query: string;
    spaceId?: string;
  }) {
    return toolsClient.larkDoc.searchWiki.query(params);
  }

  async listWikiSpaces() {
    return toolsClient.larkDoc.listWikiSpaces.query();
  }

  async listWikiNodes(params: { spaceId: string; pageToken?: string; pageSize?: number }) {
    return toolsClient.larkDoc.listWikiNodes.query(params);
  }
}

export const larkDocService = new LarkDocService();
