import { publicProcedure, router } from '@/libs/trpc/lambda';

import { klavisRouter } from './klavis';
import { larkDocRouter } from './larkDoc';
import { larkMessageRouter } from './larkMessage';
import { marketRouter } from './market';
import { mcpRouter } from './mcp';
import { searchRouter } from './search';

export const toolsRouter = router({
  healthcheck: publicProcedure.query(() => "i'm live!"),
  klavis: klavisRouter,
  larkDoc: larkDocRouter,
  larkMessage: larkMessageRouter,
  market: marketRouter,
  mcp: mcpRouter,
  search: searchRouter,
});

export type ToolsRouter = typeof toolsRouter;
