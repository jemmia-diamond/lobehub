import type { BuiltinToolManifest } from '@lobechat/types';

import { LarkMessageApiName, LarkMessageIdentifier } from './types';

export const LarkMessageManifest: BuiltinToolManifest = {
  api: [
    {
      description: 'Search for a Lark user by name or email to get their user_id.',
      name: LarkMessageApiName.findUser,
      parameters: {
        additionalProperties: false,
        properties: {
          query: {
            description: 'The name, email, or phone number of the user to search for.',
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
    {
      description: 'Get the list of chats (groups or P2P) that the current user is in.',
      name: LarkMessageApiName.getChats,
      parameters: {
        additionalProperties: false,
        properties: {},
        type: 'object',
      },
    },
    {
      description: 'Get message history from a specific chat within a time range.',
      name: LarkMessageApiName.getMessages,
      parameters: {
        additionalProperties: false,
        properties: {
          chatId: {
            description: 'The unique ID of the chat.',
            type: 'string',
          },
          endTime: {
            description: 'End time in Unix timestamp (seconds).',
            type: 'number',
          },
          startTime: {
            description: 'Start time in Unix timestamp (seconds).',
            type: 'number',
          },
        },
        required: ['chatId'],
        type: 'object',
      },
    },
    {
      description: 'Search for active employees in the organization directory by name or query.',
      name: LarkMessageApiName.searchEmployees,
      parameters: {
        additionalProperties: false,
        properties: {
          pageSize: {
            description: 'The number of employees to return per page (default 4).',
            type: 'number',
          },
          pageToken: {
            description: 'The token for the next page of results.',
            type: 'string',
          },
          query: {
            description: 'The search query (name, pinyin, or other keywords).',
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
    {
      description: 'Send a message to a Lark user or chat group.',
      name: LarkMessageApiName.sendMessage,
      parameters: {
        additionalProperties: false,
        properties: {
          content: {
            description: 'The content of the message.',
            type: 'string',
          },
          msgType: {
            description: 'The type of message. "text" is default.',
            enum: ['text', 'post', 'image', 'file'],
            type: 'string',
          },
          receiveId: {
            description: 'The ID of the receiver (user_id, chat_id, etc.).',
            type: 'string',
          },
          receiveIdType: {
            description: 'The type of receive_id. "chat_id" is default.',
            enum: ['open_id', 'user_id', 'union_id', 'chat_id'],
            type: 'string',
          },
        },
        required: ['content', 'receiveId'],
        type: 'object',
      },
    },
  ],
  identifier: LarkMessageIdentifier,
  meta: {
    avatar: '💬',
    description: 'Read, search and send Lark/Feishu messages and chats',
    title: 'Lark Message Tool',
  },
  systemRole:
    'You are a helpful assistant that can read and send Lark/Feishu messages. If the user asks you to summarize a conversation with someone, first use `findUser` to get their ID, then use `getChats` to find the chat ID between you and them, and finally use `getMessages` to read the history. If asked to send a message, use `sendMessage`.',
};
