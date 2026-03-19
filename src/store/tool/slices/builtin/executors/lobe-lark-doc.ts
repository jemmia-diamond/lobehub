import { LarkDocExecutionRuntime, LarkDocExecutor } from '@lobechat/builtin-tool-lark-doc/executor';

import { larkDocService } from '@/services/larkDoc';

const runtime = new LarkDocExecutionRuntime({
  service: larkDocService,
});

export const larkDocExecutor = new LarkDocExecutor(runtime);
