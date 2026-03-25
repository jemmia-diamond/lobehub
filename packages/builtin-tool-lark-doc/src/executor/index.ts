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

export class LarkDocExecutionRuntime {
  private appId: string | undefined;
  private appSecret: string | undefined;
  private userAccessToken?: string;
  private service?: any;
  private tenantAccessToken?: string;

  constructor(options: {
    appId?: string;
    appSecret?: string;
    service?: any;
    userAccessToken?: string;
  }) {
    this.appId = options.appId;
    this.appSecret = options.appSecret;
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
    if (this.userAccessToken) return this.userAccessToken;
    if (this.tenantAccessToken) return this.tenantAccessToken;

    if (!this.appId || !this.appSecret) throw new Error('Missing Lark App ID/Secret');

    const baseUrl = this.getBaseUrl();
    const tokenRes = await fetch(`${baseUrl}/auth/v3/tenant_access_token/internal`, {
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!tokenRes.ok) throw new Error(`Lark auth failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) throw new Error(`Lark auth error: ${tokenData.msg}`);
    this.tenantAccessToken = tokenData.tenant_access_token;
    return tokenData.tenant_access_token;
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
}
