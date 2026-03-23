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
  page?: number;
  query: string;
}

async function getLarkToken(
  appId: string,
  appSecret: string,
  userAccessToken?: string,
): Promise<string> {
  if (userAccessToken) return userAccessToken;
  const baseUrl = 'https://open.larksuite.com/open-apis';
  const tokenRes = await fetch(`${baseUrl}/auth/v3/tenant_access_token/internal`, {
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!tokenRes.ok) throw new Error(`Lark auth failed: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  if (tokenData.code !== 0) throw new Error(`Lark auth error: ${tokenData.msg}`);
  return tokenData.tenant_access_token;
}

async function fetchLarkDocContent(
  appId: string,
  appSecret: string,
  documentId: string,
  userAccessToken?: string,
): Promise<string> {
  const baseUrl = 'https://open.larksuite.com/open-apis';
  const token = await getLarkToken(appId, appSecret, userAccessToken);

  const docRes = await fetch(`${baseUrl}/docx/v1/documents/${documentId}/raw_content`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });

  if (!docRes.ok) {
    const errorBody = await docRes.text();
    throw new Error(`Lark doc fetch failed: ${docRes.status}. Details: ${errorBody}`);
  }

  const docData = await docRes.json();
  if (docData.code !== 0) throw new Error(`Lark doc error: ${docData.msg}`);

  if (!docData.data || !docData.data.content) {
    throw new Error('No content found in the document');
  }

  return docData.data.content;
}

async function fetchLarkDocMeta(
  appId: string,
  appSecret: string,
  documentId: string,
  userAccessToken?: string,
): Promise<any> {
  const baseUrl = 'https://open.larksuite.com/open-apis';
  const token = await getLarkToken(appId, appSecret, userAccessToken);

  // Fallback to fetch meta via search API if drive/v1/files/:file_token fails for docs
  const res = await fetch(`${baseUrl}/suite/docs-api/search/object`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ search_key: documentId, count: 10, offset: 0 }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Lark doc meta failed: ${res.status}. Details: ${errorBody}`);
  }

  const data = await res.json();
  if (data.code !== 0) throw new Error(`Lark doc meta error: ${data.msg}`);

  const docs = data.data?.docs || [];
  const ExactMatch = docs.find((d: any) => d.docs_token === documentId);
  return ExactMatch || { id: documentId, title: 'Unknown Title', type: 'unknown' };
}

async function listLarkDocs(
  appId: string,
  appSecret: string,
  folderToken?: string,
  userAccessToken?: string,
): Promise<any[]> {
  const baseUrl = 'https://open.larksuite.com/open-apis';
  const token = await getLarkToken(appId, appSecret, userAccessToken);

  let url = `${baseUrl}/drive/v1/files`;
  if (folderToken) {
    url += `?folder_token=${folderToken}`;
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

async function searchLarkDocs(
  appId: string,
  appSecret: string,
  query: string,
  userAccessToken?: string,
  page: number = 1,
): Promise<{ items: any[]; total?: number; has_more?: boolean }> {
  const baseUrl = 'https://open.larksuite.com/open-apis';
  const token = await getLarkToken(appId, appSecret, userAccessToken);

  const searchRes = await fetch(`${baseUrl}/drive/v1/files/search`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ search_key: query || '', count: 15, offset: (page - 1) * 15 }),
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
    items,
    total: searchData.data?.total || 0,
    has_more: searchData.data?.has_more || false,
  };
}

export class LarkDocExecutionRuntime {
  private appId: string | undefined;
  private appSecret: string | undefined;
  private userAccessToken?: string;
  private service?: any;

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

  async getDocContent(params: GetDocContentParams): Promise<BuiltinToolResult> {
    const { documentId } = params;
    if (!documentId) return { content: 'documentId is required', success: false };

    if (this.service) return this.service.getDocContent(params);

    if (!this.appId || !this.appSecret)
      return { content: 'Missing Lark App ID/Secret', success: false };

    try {
      const content = await fetchLarkDocContent(
        this.appId,
        this.appSecret,
        documentId,
        this.userAccessToken,
      );
      return { content, success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async getDocMetaRaw(params: GetDocContentParams): Promise<any> {
    const { documentId } = params;
    if (!documentId) throw new Error('documentId is required');
    if (!this.appId || !this.appSecret) throw new Error('Missing Lark App ID/Secret');

    try {
      return await fetchLarkDocMeta(this.appId, this.appSecret, documentId, this.userAccessToken);
    } catch (error) {
      throw new Error(`Error fetching doc meta: ${(error as Error).message}`, { cause: error });
    }
  }

  async getDocMeta(params: GetDocContentParams): Promise<BuiltinToolResult> {
    try {
      const meta = await this.getDocMetaRaw(params);
      return { content: JSON.stringify(meta), success: true };
    } catch (error) {
      return { content: `Error: ${(error as Error).message}`, success: false };
    }
  }

  async listDocsRaw(params: ListDocsParams): Promise<any[]> {
    if (!this.appId || !this.appSecret) throw new Error('Missing Lark App ID/Secret');

    try {
      return await listLarkDocs(
        this.appId,
        this.appSecret,
        params.folderToken,
        this.userAccessToken,
      );
    } catch (error) {
      throw new Error(`Error listing docs: ${(error as Error).message}`, { cause: error });
    }
  }

  async listDocs(params: ListDocsParams): Promise<BuiltinToolResult> {
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
    const { query, page = 1 } = params;

    if (!this.appId || !this.appSecret) {
      throw new Error('Missing Lark App ID/Secret');
    }

    try {
      const res = await searchLarkDocs(
        this.appId,
        this.appSecret,
        query,
        this.userAccessToken,
        page,
      );
      return res;
    } catch (error) {
      throw new Error(`Error searching docs: ${(error as Error).message}`, { cause: error });
    }
  }

  async searchDocs(params: SearchDocsParams): Promise<BuiltinToolResult> {
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
