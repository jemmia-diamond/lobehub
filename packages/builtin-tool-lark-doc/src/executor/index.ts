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
  query: string;
}

async function fetchLarkDocContent(
  appId: string,
  appSecret: string,
  documentId: string,
  userAccessToken?: string,
): Promise<string> {
  const baseUrl = 'https://open.larksuite.com/open-apis';
  let token = userAccessToken;

  if (!token) {
    const tokenRes = await fetch(`${baseUrl}/auth/v3/tenant_access_token/internal`, {
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!tokenRes.ok) throw new Error(`Lark auth failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    if (tokenData.code !== 0) throw new Error(`Lark auth error: ${tokenData.msg}`);
    token = tokenData.tenant_access_token;
  }

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
  // TODO: Implement get meta logic using drive/v1/files/:file_token
  return { id: documentId, title: 'Mock Title', type: 'docx' };
}

async function listLarkDocs(
  appId: string,
  appSecret: string,
  folderToken?: string,
  userAccessToken?: string,
): Promise<any[]> {
  // TODO: Implement list logic using drive/v1/files
  return [];
}

async function searchLarkDocs(
  appId: string,
  appSecret: string,
  query: string,
  userAccessToken?: string,
): Promise<any[]> {
  // TODO: Implement search logic using suite/docs-api/search/object
  return [];
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

  async getDocMeta(params: GetDocContentParams): Promise<BuiltinToolResult> {
    // Similar structure to getDocContent, implemented for future use
    return { content: 'Not implemented yet', success: false };
  }

  async listDocs(params: ListDocsParams): Promise<BuiltinToolResult> {
    // Similar structure, implemented for future use
    return { content: 'Not implemented yet', success: false };
  }

  async searchDocs(params: SearchDocsParams): Promise<BuiltinToolResult> {
    // Similar structure, implemented for future use
    return { content: 'Not implemented yet', success: false };
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
