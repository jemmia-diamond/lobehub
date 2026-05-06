import { LarkMessageManifest } from '@lobechat/builtin-tool-lark-message';
import { LarkMessageExecutionRuntime } from '@lobechat/builtin-tool-lark-message/executor';

import { getLarkUserAccessToken } from '@/server/services/larkAuth';

import { type ServerRuntimeRegistration } from './types';

export const larkMessageRuntime: ServerRuntimeRegistration = {
  factory: async (context) => {
    const userAccessToken = await getLarkUserAccessToken(context);

    return new LarkMessageExecutionRuntime({
      userAccessToken,
    });
  },
  identifier: LarkMessageManifest.identifier,
};
