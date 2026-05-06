import { LarkDocManifest } from '@lobechat/builtin-tool-lark-doc';
import { LarkDocExecutionRuntime } from '@lobechat/builtin-tool-lark-doc/executor';

import { getLarkUserAccessToken } from '@/server/services/larkAuth';

import { type ServerRuntimeRegistration } from './types';

export const larkDocRuntime: ServerRuntimeRegistration = {
  factory: async (context) => {
    const userAccessToken = await getLarkUserAccessToken(context);

    return new LarkDocExecutionRuntime({
      userAccessToken,
    });
  },
  identifier: LarkDocManifest.identifier,
};
