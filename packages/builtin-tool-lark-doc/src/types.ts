export const LarkDocIdentifier = 'lark-doc-reader';

export enum LarkDocApiName {
  getDocContent = 'getDocContent',
  getDocMeta = 'getDocMeta',
  listDocs = 'listDocs',
  searchDocs = 'searchDocs',
}

export type LarkDocApiNameType = (typeof LarkDocApiName)[keyof typeof LarkDocApiName];
