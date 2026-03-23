import { LarkMessageManifest } from '@lobechat/builtin-tool-lark-message';
import { LarkMessageExecutionRuntime } from '@lobechat/builtin-tool-lark-message/executor';

import { authEnv } from '@/envs/auth';

import { type ServerRuntimeRegistration } from './types';

/**
 * LarkMessage Server Runtime
 * Pre-instantiated runtime to inject secure server-side environment variables
 */
export const larkMessageRuntime: ServerRuntimeRegistration = {
  factory: () => {
    return new LarkMessageExecutionRuntime({
      appId: authEnv.AUTH_LARK_APP_ID,
      appSecret: authEnv.AUTH_LARK_APP_SECRET,
    });
  },
  identifier: LarkMessageManifest.identifier,
};
