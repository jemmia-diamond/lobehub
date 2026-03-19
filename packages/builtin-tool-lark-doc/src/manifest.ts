import { type BuiltinToolManifest } from '@lobechat/types';

import { LarkDocApiName, LarkDocIdentifier } from './types';

export const LarkDocManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Read and extract raw content from a Lark/Feishu Document. When the user provides a Lark/Feishu URL, extract the document ID and call this tool.',
      name: LarkDocApiName.getDocContent,
      parameters: {
        additionalProperties: false,
        properties: {
          documentId: {
            description:
              "The unique ID of the Lark document (e.g. 'doxcndabc123...'). Extract this directly from the URL provided by the user.",
            type: 'string',
          },
        },
        required: ['documentId'],
        type: 'object',
      },
    },
    {
      description: 'Get metadata of a Lark Document (title, owner, create time, update time).',
      name: LarkDocApiName.getDocMeta,
      parameters: {
        additionalProperties: false,
        properties: {
          documentId: {
            description: 'The unique ID of the Lark document.',
            type: 'string',
          },
        },
        required: ['documentId'],
        type: 'object',
      },
    },
    {
      description: 'List recent documents from Lark Drive folder.',
      name: LarkDocApiName.listDocs,
      parameters: {
        additionalProperties: false,
        properties: {
          folderToken: {
            description:
              'The folder token to list files from. If not provided, list from root folder.',
            type: 'string',
          },
        },
        type: 'object',
      },
    },
    {
      description: 'Search for documents in Lark Drive by keyword.',
      name: LarkDocApiName.searchDocs,
      parameters: {
        additionalProperties: false,
        properties: {
          query: {
            description: 'The keyword to search for.',
            type: 'string',
          },
        },
        required: ['query'],
        type: 'object',
      },
    },
  ],
  identifier: LarkDocIdentifier,
  meta: {
    avatar: '📝',
    description: 'Read, search, and manage Lark/Feishu Docs',
    title: 'Lark Doc Reader',
  },
  systemRole:
    'You are a helpful assistant that can interact with Lark/Feishu documents. You can read content, get metadata, search for docs, and list files. Whenever a user provides a Lark Doc URL, automatically extract the ID and use the appropriate tool.',
  type: 'builtin',
};
