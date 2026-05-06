export const LarkDocIdentifier = 'lark-doc-reader';

export enum LarkDocApiName {
  getDocContent = 'getDocContent',
  getDocMeta = 'getDocMeta',
  listDocs = 'listDocs',
  listWikiNodes = 'listWikiNodes',
  listWikiSpaces = 'listWikiSpaces',
  searchDocs = 'searchDocs',
  searchWiki = 'searchWiki',
}

export type LarkDocApiNameType = (typeof LarkDocApiName)[keyof typeof LarkDocApiName];
