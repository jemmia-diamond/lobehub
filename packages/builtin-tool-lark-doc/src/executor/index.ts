import type { BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { LarkDocApiName, LarkDocIdentifier } from '../types';

interface GetDocContentParams {
  documentId: string;
}

interface ListDocsParams {
  folderToken?: string;
}

interface SearchDocsParams {
  chatIds?: string[];
  ownerIds?: string[];
  page?: number;
  pageSize?: number;
  query: string;
  sortBy?: number;
}

interface SearchWikiParams {
  pageSize?: number;
  pageToken?: string;
  query: string;
  spaceId?: string;
}

export class LarkDocExecutionRuntime {
  private userAccessToken?: string;
  private service?: any;

  constructor(options: {
    service?: any;
    userAccessToken?: string;
  }) {
    this.service = options.service;
    this.userAccessToken = options.userAccessToken;
  }

  private getBaseUrl(): string {
    if (typeof process !== 'undefined' && process.env.AUTH_FEISHU_APP_ID) {
      return 'https://open.feishu.cn/open-apis';
    }
    return 'https://open.larksuite.com/open-apis';
  }

  private async getLarkToken(): Promise<string> {
    if (!this.userAccessToken) {
      throw new Error('Missing Lark User Access Token. Please ensure you are authenticated with Lark SSO.');
    }
    return this.userAccessToken;
  }

  async getDocContent(params: GetDocContentParams): Promise<BuiltinToolResult> {
    const { documentId } = params;
    if (!documentId) return { content: 'documentId is required', success: false };

    if (this.service) return this.service.getDocContent(params);

    try {
      const baseUrl = this.getBaseUrl();
      const token = await this.getLarkToken();

      const docRes = await fetch(`${baseUrl}/docx/v1/documents/${documentId}/raw_content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      if (!docRes.ok) {
        const errorBody = await docRes.text();
        return {
          content: `Lark doc fetch failed: ${docRes.status}. Details: ${errorBody}`,
          success: false,
        };
      }

      const docData = await docRes.json();
      if (docData.code !== 0) return { content: `Lark doc error: ${docData.msg}`, success: false };

      return { content: docData.data?.content || 'No content found', success: true };
    } catch (e) {
      return { content: `Error: ${(e as Error).message}`, success: false };
    }
  }

  async getDocMetaRaw(params: GetDocContentParams): Promise<any> {
    const { documentId } = params;
    if (!documentId) throw new Error('documentId is required');

    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const res = await fetch(`${baseUrl}/suite/docs-api/search/object`, {
      body: JSON.stringify({ count: 10, offset: 0, search_key: documentId }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Lark doc meta failed: ${res.status}. Details: ${errorBody}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark doc meta error: ${data.msg}`);

    const docs = data.data?.docs || [];
    const exactMatch = docs.find((d: any) => d.docs_token === documentId);
    return exactMatch || { id: documentId, title: 'Unknown Title', type: 'unknown' };
  }

  async getDocMeta(params: GetDocContentParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.getDocMeta(params);
    try {
      const meta = await this.getDocMetaRaw(params);
      return { content: JSON.stringify(meta), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async listDocsRaw(params: ListDocsParams): Promise<any[]> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    let url = `${baseUrl}/drive/v1/files`;
    if (params.folderToken) {
      url += `?folder_token=${params.folderToken}`;
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Lark list failed: ${res.status}. Details: ${errorBody}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark list error: ${data.msg}`);

    return data.data?.files || [];
  }

  async listDocs(params: ListDocsParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.listDocs(params);
    try {
      const docs = await this.listDocsRaw(params);
      return { content: JSON.stringify(docs), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async searchDocsRaw(
    params: SearchDocsParams,
  ): Promise<{ items: any[]; total?: number; has_more?: boolean }> {
    const { query, page = 1, pageSize = 15 } = params;

    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const searchRes = await fetch(`${baseUrl}/drive/v1/files/search`, {
      body: JSON.stringify({
        chat_ids: params.chatIds,
        count: pageSize,
        offset: (page - 1) * pageSize,
        owner_ids: params.ownerIds,
        search_key: query || '',
        sort_by: params.sortBy,
      }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!searchRes.ok) {
      const errorBody = await searchRes.text();
      throw new Error(`Lark doc search failed: ${searchRes.status}. Details: ${errorBody}`);
    }

    const searchData = await searchRes.json();
    if (searchData.code !== 0) throw new Error(`Lark search error: ${searchData.msg}`);

    const items =
      searchData.data?.docs_entities ||
      searchData.data?.items ||
      searchData.data?.docs ||
      searchData.data?.files ||
      [];
    return {
      has_more: searchData.data?.has_more || false,
      items,
      total: searchData.data?.total || 0,
    };
  }

  async searchDocs(params: SearchDocsParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.searchDocs(params);
    try {
      const res = await this.searchDocsRaw(params);
      return { content: JSON.stringify(res), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async searchWikiRaw(
    params: SearchWikiParams,
  ): Promise<{ items: any[]; has_more?: boolean; page_token?: string }> {
    const { query, spaceId, pageSize = 15, pageToken } = params;

    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const payload: Record<string, any> = {
      page_size: pageSize,
      query: query || '',
    };
    if (spaceId && spaceId !== 'undefined' && spaceId !== 'null') {
      payload.space_id = spaceId;
    }
    if (pageToken) {
      payload.page_token = pageToken;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    };

    const searchRes = await fetch(`${baseUrl}/wiki/v2/nodes/search`, {
      body: JSON.stringify(payload),
      headers,
      method: 'POST',
    });

    if (!searchRes.ok) {
      const errorBody = await searchRes.text();
      console.error('[LarkDoc] Search Wiki Failed:', {
        body: errorBody,
        status: searchRes.status,
      });
      throw new Error(`Lark wiki search failed: ${searchRes.status}. Details: ${errorBody}`);
    }

    const searchData = await searchRes.json();
    if (searchData.code !== 0) throw new Error(`Lark wiki search error: ${searchData.msg}`);

    const items = searchData.data?.nodes || searchData.data?.items || [];
    return {
      has_more: searchData.data?.has_more || false,
      items,
      page_token: searchData.data?.page_token,
    };
  }

  async searchWiki(params: SearchWikiParams): Promise<BuiltinToolResult> {
    if (this.service && typeof this.service.searchWiki === 'function') {
      return this.service.searchWiki(params);
    }
    try {
      const res = await this.searchWikiRaw(params);
      return { content: JSON.stringify(res), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async listWikiSpacesRaw(): Promise<any[]> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const res = await fetch(`${baseUrl}/wiki/v2/spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      method: 'GET',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[LarkDoc] List Wiki Spaces Failed:', {
        body: errorBody,
        status: res.status,
      });
      throw new Error(`Lark list wiki spaces failed: ${res.status}. Details: ${errorBody}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark list wiki spaces error: ${data.msg}`);

    return data.data?.items || [];
  }

  async listWikiSpaces(): Promise<BuiltinToolResult> {
    try {
      const spaces = await this.listWikiSpacesRaw();
      return { content: JSON.stringify(spaces), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async listWikiNodesRaw(spaceId: string): Promise<any[]> {
    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const res = await fetch(`${baseUrl}/wiki/v2/spaces/${spaceId}/nodes?page_size=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      method: 'GET',
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Lark list wiki nodes failed: ${res.status}. Details: ${errorBody}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark list wiki nodes error: ${data.msg}`);

    return data.data?.items || [];
  }

  async listWikiNodes(spaceId: string): Promise<BuiltinToolResult> {
    try {
      const items = await this.listWikiNodesRaw(spaceId);
      return { content: JSON.stringify({ items }), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }
}

export class LarkDocExecutor extends BaseExecutor<typeof LarkDocApiName> {
  readonly identifier = LarkDocIdentifier;
  protected readonly apiEnum = LarkDocApiName;

  private runtime: LarkDocExecutionRuntime;

  constructor(runtime: LarkDocExecutionRuntime) {
    super();
    this.runtime = runtime;
  }

  getDocContent = async (params: GetDocContentParams) => this.runtime.getDocContent(params);
  getDocMeta = async (params: GetDocContentParams) => this.runtime.getDocMeta(params);
  listDocs = async (params: ListDocsParams) => this.runtime.listDocs(params);
  searchDocs = async (params: SearchDocsParams) => this.runtime.searchDocs(params);
  searchWiki = async (params: SearchWikiParams) => this.runtime.searchWiki(params);
  listWikiSpaces = async () => this.runtime.listWikiSpaces();
  listWikiNodes = async (params: { spaceId: string }) => this.runtime.listWikiNodes(params.spaceId);
}
