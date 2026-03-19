import { LarkDocManifest } from '@lobechat/builtin-tool-lark-doc';
import { LarkDocExecutionRuntime } from '@lobechat/builtin-tool-lark-doc/executor';

import { authEnv } from '@/envs/auth';

import { type ServerRuntimeRegistration } from './types';

/**
 * LarkDoc Server Runtime
 * Pre-instantiated runtime to inject secure server-side environment variables
 */
export const larkDocRuntime: ServerRuntimeRegistration = {
  factory: () => {
    return new LarkDocExecutionRuntime({
      appId: authEnv.AUTH_LARK_APP_ID,
      appSecret: authEnv.AUTH_LARK_APP_SECRET,
    });
  },
  identifier: LarkDocManifest.identifier,
};
