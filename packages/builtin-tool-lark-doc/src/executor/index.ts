import type { BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { LarkDocApiName, LarkDocIdentifier } from '../types';

interface GetDocContentParams {
  documentId: string;
}

interface SearchDocsParams {
  count?: number;
  docsTypes?: string[];
  offset?: number;
  searchKey: string;
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

  async searchDocsRaw(params: SearchDocsParams): Promise<{
    docs_entities: any[];
    has_more: boolean;
    total: number;
  }> {
    const { searchKey, count = 15, offset = 0, docsTypes } = params;

    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    const body: Record<string, any> = {
      count: Number(count),
      offset: Number(offset),
      search_key: searchKey,
    };

    if (docsTypes && docsTypes.length > 0) {
      body.docs_types = docsTypes;
    }

    const res = await fetch(`${baseUrl}/suite/docs-api/search/object`, {
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Lark doc search failed: ${res.status}. Details: ${JSON.stringify(data)}`);
    }
    if (data.code !== 0) throw new Error(`Lark doc search error: ${data.msg}`);

    return {
      docs_entities: data.data?.docs_entities || [],
      has_more: data.data?.has_more || false,
      total: data.data?.total || 0,
    };
  }

  async searchDocs(params: SearchDocsParams): Promise<BuiltinToolResult> {
    try {
      const result = await this.searchDocsRaw(params);
      // Normalize to same shape as other list methods for the modal
      const items = result.docs_entities.map((d: any) => ({
        obj_token: d.docs_token,
        obj_type: d.docs_type,
        title: d.title,
        owner_id: d.owner_id,
      }));
      return {
        content: JSON.stringify({
          has_more: result.has_more,
          items,
          page_token: result.has_more ? (params.offset || 0) + items.length : undefined,
          total: result.total,
        }),
        success: true,
      };
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
      page_size: Number(pageSize),
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

  async listWikiNodesRaw(params: {
    pageSize?: number;
    pageToken?: string;
    spaceId: string;
  }): Promise<{ has_more: boolean; items: any[]; page_token: string }> {
    const { spaceId, pageToken, pageSize = 15 } = params;
    const baseUrl = this.getBaseUrl();
    const token = await this.getLarkToken();

    let url = `${baseUrl}/wiki/v2/spaces/${spaceId}/nodes?page_size=${Number(pageSize)}`;
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }

    const res = await fetch(url, {
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

    return {
      has_more: data.data?.has_more || false,
      items: data.data?.items || [],
      page_token: data.data?.page_token || '',
    };
  }

  async listWikiNodes(params: {
    pageSize?: number;
    pageToken?: string;
    spaceId: string;
  }): Promise<BuiltinToolResult> {
    try {
      const result = await this.listWikiNodesRaw(params);
      return { content: JSON.stringify(result), success: true };
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
  searchDocs = async (params: SearchDocsParams) => this.runtime.searchDocs(params);
  searchWiki = async (params: SearchWikiParams) => this.runtime.searchWiki(params);
  listWikiSpaces = async () => this.runtime.listWikiSpaces();
  listWikiNodes = async (params: { spaceId: string; pageToken?: string; pageSize?: number }) =>
    this.runtime.listWikiNodes(params);
}
