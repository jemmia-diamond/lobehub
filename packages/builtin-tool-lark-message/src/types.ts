export const LarkMessageIdentifier = 'lark-message-reader';

export enum LarkMessageApiName {
  findUser = 'findUser',
  getChats = 'getChats',
  getMessages = 'getMessages',
  searchEmployees = 'searchEmployees',
  sendMessage = 'sendMessage',
}

export type LarkMessageApiNameType = (typeof LarkMessageApiName)[keyof typeof LarkMessageApiName];
