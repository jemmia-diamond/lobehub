import {
  LarkMessageExecutionRuntime,
  LarkMessageExecutor,
} from '@lobechat/builtin-tool-lark-message/executor';

import { larkMessageService } from '@/services/larkMessage';

const runtime = new LarkMessageExecutionRuntime({
  service: larkMessageService,
});

export const larkMessageExecutor = new LarkMessageExecutor(runtime);
