import type { BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { LarkMessageApiName, LarkMessageIdentifier } from '../types';

interface FindUserParams {
  query: string;
}

interface GetChatsParams {
  chatType?: 'p2p' | 'group';
}

interface GetMessagesParams {
  chatId: string;
  endTime?: number;
  startTime?: number;
}

// Logic thực thi gọi API Lark (Server-side) hoặc delegate cho Service (Client-side)
export class LarkMessageExecutionRuntime {
  private appId?: string;
  private appSecret?: string;
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

  async findUser(params: FindUserParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.findUser(params);

    // Fallback: search in recent P2P chats
    const chatsResult = await this.getChats({ chatType: 'p2p' });
    if (!chatsResult.success) return chatsResult;

    try {
      const chats = JSON.parse(chatsResult.content || '[]');
      const found = chats.filter(
        (c: any) =>
          c.name.toLowerCase().includes(params.query.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(params.query.toLowerCase())),
      );

      if (found.length === 0) return { content: 'User not found in recent chats.', success: false };

      return { content: JSON.stringify(found), success: true };
    } catch {
      return { content: 'Failed to parse chat list', success: false };
    }
  }

  async getChats(params: GetChatsParams): Promise<BuiltinToolResult> {
    if (this.service) return this.service.getChats(params);

    if (!this.userAccessToken) return { content: 'Authentication required', success: false };

    try {
      const url = new URL('https://open.larksuite.com/open-apis/im/v1/chats');
      url.searchParams.append('page_size', '50');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.userAccessToken}` },
      });

      if (!res.ok) {
        const err = await res.text();
        return { content: `Failed to fetch chats: ${err}`, success: false };
      }

      const data = await res.json();
      if (data.code !== 0) return { content: `Lark API error: ${data.msg}`, success: false };

      let chats = data.data.items || [];
      if (params.chatType) {
        chats = chats.filter((c: any) => c.chat_mode === params.chatType);
      }

      // Map to simpler format
      const result = chats.map((c: any) => ({
        chat_id: c.chat_id,
        name: c.name,
        description: c.description,
        chat_mode: c.chat_mode, // p2p, group
        owner_id: c.owner_id,
      }));

      return { content: JSON.stringify(result), success: true };
    } catch (error) {
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
  getChats = async (params: GetChatsParams) => this.runtime.getChats(params);
  getMessages = async (params: GetMessagesParams) => this.runtime.getMessages(params);
}
