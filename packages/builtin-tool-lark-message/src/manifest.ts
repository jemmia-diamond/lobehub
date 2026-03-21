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
        properties: {
          chatType: {
            description: 'The type of chat. "p2p" for direct messages, "group" for group chats.',
            type: 'string',
            enum: ['p2p', 'group'],
          },
        },
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
          startTime: {
            description: 'Start time in Unix timestamp (seconds).',
            type: 'number',
          },
          endTime: {
            description: 'End time in Unix timestamp (seconds).',
            type: 'number',
          },
        },
        required: ['chatId'],
        type: 'object',
      },
    },
  ],
  identifier: LarkMessageIdentifier,
  meta: {
    avatar: '💬',
    description: 'Read and search your Lark/Feishu messages and chats',
    title: 'Lark Message Reader',
  },
  systemRole:
    'You are a helpful assistant that can read Lark/Feishu messages. If the user asks you to summarize a conversation with someone, first use `findUser` to get their ID, then use `getChats` to find the chat ID between you and them, and finally use `getMessages` to read the history.',
};
