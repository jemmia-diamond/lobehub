import type { BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { LarkMessageApiName, LarkMessageIdentifier } from '../types';

interface FindUserParams {
  pageSize?: number;
  pageToken?: string;
  query: string;
}

interface SendMessageParams {
  content: string;
  msgType?: 'text' | 'post' | 'image' | 'file';
  receiveId: string;
  receiveIdType?: 'open_id' | 'user_id' | 'union_id' | 'chat_id';
}

interface GetChatsParams {
  pageSize?: number;
  pageToken?: string;
  sortType?: string;
  userIdType?: string;
}

interface GetMessagesParams {
  chatId: string;
  endTime?: number;
  startTime?: number;
}

export class LarkMessageExecutionRuntime {
  private appId?: string;
  private appSecret?: string;
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

  private async getTenantAccessToken(): Promise<string | null> {
    if (this.tenantAccessToken) return this.tenantAccessToken;
    if (!this.appId || !this.appSecret) {
      console.error('[LarkExecutor] Missing appId or appSecret');
      return null;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/auth/v3/tenant_access_token/internal`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[LarkExecutor] Failed to fetch tenant token:', err);
        return null;
      }

      const data = await res.json();
      if (data.code !== 0) {
        console.error('[LarkExecutor] Lark API error fetching tenant token:', data.msg);
        return null;
      }

      this.tenantAccessToken = data.tenant_access_token;
      return this.tenantAccessToken || null;
    } catch (e) {
      console.error('[LarkExecutor] getTenantAccessToken error:', e);
      return null;
    }
  }

  private mapLarkUser(u: any) {
    const info = u.base_info || u;

    const nameObj = info.name;
    const name =
      typeof nameObj === 'string'
        ? nameObj
        : nameObj?.name?.default_value ||
          nameObj?.default_value ||
          info.en_name ||
          info.title ||
          u.name ||
          '';

    const dept = info.departments?.[0]?.name || '';

    return {
      avatar: info.avatar?.avatar_72 || info.avatar?.avatar_origin || info.avatar_url || '',
      bio: info.description || info.introduction || info.job_title || info.mobile || '',
      chat_id:
        info.employee_id ||
        info.user_id ||
        info.open_id ||
        info.chat_id ||
        info.id ||
        u.user_id ||
        u.chat_id,
      department: dept,
      description:
        dept ||
        info.description ||
        info.introduction ||
        info.job_title ||
        info.mobile ||
        info.email ||
        'Lark User',
      email: info.email,
      employee_id: info.employee_id,
      en_name: info.en_name,
      mobile: info.mobile,
      name: name || 'No Name',
    };
  }

  async findUser(params: FindUserParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.findUser(params);

    const token = this.userAccessToken || (await this.getTenantAccessToken());
    if (!token) return { content: 'Authentication required', success: false };

    try {
      const baseUrl = this.getBaseUrl();
      const url = new URL(`${baseUrl}/search/v1/user`);
      url.searchParams.append('query', params.query);
      url.searchParams.append('user_id_type', 'open_id');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
      });

      if (!res.ok) {
        const err = await res.text();
        return { content: `Failed: ${err}`, success: false };
      }

      const data = await res.json();
      if (data.code !== 0)
        return { content: `Error: ${data.msg} (code: ${data.code})`, success: false };

      const rawItems = data.data.users || data.data.items || [];
      const users = rawItems.map((u: any) => this.mapLarkUser(u));

      return {
        content: JSON.stringify({
          hasMore: data.data.has_more,
          items: users,
          nextPageToken: data.data.page_token,
        }),
        success: true,
      };
    } catch (e) {
      console.error('[LarkExecutor] findUser exception:', e);
      return { content: `Exception: ${e}`, success: false };
    }
  }

  async searchEmployees(params: FindUserParams): Promise<BuiltinToolResult> {
    const token = await this.getTenantAccessToken();
    if (!token) return { content: 'Authentication required', success: false };

    try {
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/directory/v1/employees/search`;
      const res = await fetch(url, {
        body: JSON.stringify({
          page_request: {
            page_size: params.pageSize || 4,
            page_token: params.pageToken,
          },
          query: params.query,
          required_fields: [
            'base_info.name',
            'base_info.avatar',
            'base_info.departments',
            'base_info.department_ids',
            'base_info.employee_id',
            'base_info.email',
            'base_info.mobile',
            'base_info.en_name',
            'base_info.description',
          ],
        }),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[LarkExecutor] searchEmployees failed:', res.status, err);
        return { content: `Failed: ${err}`, success: false };
      }

      const data = await res.json();
      console.info('[LarkExecutor] searchEmployees data:', JSON.stringify(data));
      if (data.code !== 0) return { content: `Error: ${data.msg}`, success: false };

      const rawItems = data.data.employees || data.data.users || data.data.items || [];
      const users = rawItems.map((u: any) => this.mapLarkUser(u));

      return {
        content: JSON.stringify({
          hasMore: data.data.page_response?.has_more || data.data.has_more,
          items: users,
          nextPageToken: data.data.page_response?.page_token || data.data.page_token,
        }),
        success: true,
      };
    } catch (e) {
      console.error('[LarkExecutor] searchEmployees exception:', e);
      return { content: `Exception: ${e}`, success: false };
    }
  }

  async sendMessage(params: SendMessageParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.sendMessage(params);

    if (!this.userAccessToken) return { content: 'Authentication required', success: false };

    try {
      const baseUrl = this.getBaseUrl();
      const receiveIdType = params.receiveIdType || 'chat_id';
      const url = `${baseUrl}/im/v1/messages?receive_id_type=${receiveIdType}`;

      const res = await fetch(url, {
        body: JSON.stringify({
          content:
            params.msgType === 'text' || !params.msgType
              ? JSON.stringify({ text: params.content })
              : params.content,
          msg_type: params.msgType || 'text',
          receive_id: params.receiveId,
        }),
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[LarkExecutor] sendMessage failed:', res.status, err);
        return { content: `Failed to send message: ${err}`, success: false };
      }

      const data = await res.json();
      if (data.code !== 0) return { content: `Lark API error: ${data.msg}`, success: false };

      return { content: JSON.stringify(data.data), success: true };
    } catch (error) {
      console.error('[LarkExecutor] sendMessage exception:', error);
      return { content: `Error: ${error}`, success: false };
    }
  }

  async getChats(params: GetChatsParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.getChats(params);

    if (!this.userAccessToken) return { content: 'Authentication required', success: false };

    try {
      const url = new URL(`${this.getBaseUrl()}/im/v1/chats`);
      url.searchParams.append('page_size', (params.pageSize || 50).toString());
      if (params.pageToken) url.searchParams.append('page_token', params.pageToken);
      if (params.sortType) url.searchParams.append('sort_type', params.sortType);
      if (params.userIdType) url.searchParams.append('user_id_type', params.userIdType);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.userAccessToken}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[LarkExecutor] getChats failed:', res.status, err);
        return { content: `Failed to fetch chats: ${err}`, success: false };
      }

      const data = await res.json();
      if (data.code !== 0) return { content: `Lark API error: ${data.msg}`, success: false };

      const chats = data.data.items || [];

      const result = chats.map((c: any) => ({
        avatar: c.avatar,
        chat_id: c.chat_id,
        chat_mode: c.chat_mode, // p2p, group
        description: c.description,
        name: c.name,
        owner_id: c.owner_id,
      }));

      return {
        content: JSON.stringify({
          items: result,
          hasMore: data.data.has_more,
          nextPageToken: data.data.page_token,
        }),
        success: true,
      };
    } catch (error) {
      console.error('[LarkExecutor] getChats exception:', error);
      return { content: `Error: ${error}`, success: false };
    }
  }

  async getMessages(params: GetMessagesParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.getMessages(params);

    if (!this.userAccessToken) return { content: 'Authentication required', success: false };

    try {
      const url = new URL('https://open.larksuite.com/open-apis/im/v1/messages');
      url.searchParams.append('container_id_type', 'chat');
      url.searchParams.append('container_id', params.chatId);
      if (params.startTime !== undefined)
        url.searchParams.append('start_time', params.startTime.toString());
      if (params.endTime !== undefined)
        url.searchParams.append('end_time', params.endTime.toString());
      url.searchParams.append('page_size', '50');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.userAccessToken}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[LarkExecutor] getMessages failed:', res.status, err);
        return { content: `Failed to fetch messages: ${err}`, success: false };
      }

      const data = await res.json();
      if (data.code !== 0) return { content: `Lark API error: ${data.msg}`, success: false };

      const messages = (data.data.items || []).map((m: any) => {
        let content = m.body.content;
        try {
          content = JSON.parse(m.body.content);
        } catch {
          // ignore
        }
        return {
          content,
          create_time: m.create_time,
          message_id: m.message_id,
          msg_type: m.msg_type,
          sender: m.sender,
        };
      });

      return { content: JSON.stringify(messages), success: true };
    } catch (error) {
      console.error('[LarkExecutor] getMessages exception:', error);
      return { content: `Error: ${error}`, success: false };
    }
  }
}

export class LarkMessageExecutor extends BaseExecutor<typeof LarkMessageApiName> {
  readonly identifier = LarkMessageIdentifier;
  protected readonly apiEnum = LarkMessageApiName;

  private runtime: LarkMessageExecutionRuntime;

  constructor(runtime: LarkMessageExecutionRuntime) {
    super();
    this.runtime = runtime;
  }

  findUser = async (params: FindUserParams) => this.runtime.findUser(params);
  sendMessage = async (params: SendMessageParams) => this.runtime.sendMessage(params);
  getChats = async (params: GetChatsParams) => this.runtime.getChats(params);
  getMessages = async (params: GetMessagesParams) => this.runtime.getMessages(params);
  searchEmployees = async (params: FindUserParams) => this.runtime.searchEmployees(params);
}
