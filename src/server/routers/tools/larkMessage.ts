import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { withLarkUserAccessToken } from '@/server/services/larkAuth';
import { larkMessageRuntime } from '@/server/services/toolExecution/serverRuntimes/larkMessage';

const larkMessageProcedure = authedProcedure.use(serverDatabase);

async function withLarkRuntime<T>(ctx: any, handler: (runtime: any) => Promise<T>): Promise<T> {
  return withLarkUserAccessToken(
    ctx,
    async (userAccessToken) => {
      const runtime = await getRuntime(userAccessToken);
      return handler(runtime);
    },
    (error) => {
      const message = String(error?.message || error || '');
      return message.includes('failed: 401');
    },
  );
}

export const larkMessageRouter = router({
  getChats: larkMessageProcedure
    .input(
      z.object({
        pageSize: z.number().optional(),
        pageToken: z.string().optional(),
        sortType: z.string().optional(),
        userIdType: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.getChats({
          pageSize: input.pageSize,
          pageToken: input.pageToken,
          sortType: input.sortType,
          userIdType: input.userIdType,
        }),
      );
    }),

  getMessages: larkMessageProcedure
    .input(
      z.object({
        chatId: z.string(),
        endTime: z.number().optional(),
        startTime: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.getMessages({
          chatId: input.chatId,
          endTime: input.endTime,
          startTime: input.startTime,
        }),
      );
    }),

  searchEmployees: larkMessageProcedure
    .input(
      z.object({
        pageSize: z.number().optional(),
        pageToken: z.string().optional(),
        query: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) => runtime.searchEmployees(input));
    }),
});

async function getRuntime(userAccessToken?: string) {
  const runtime = larkMessageRuntime.factory({ toolManifestMap: {} });

  if (userAccessToken) {
    const { authEnv } = await import('@/envs/auth');
    const { LarkMessageExecutionRuntime } =
      await import('@lobechat/builtin-tool-lark-message/executor');

    return new LarkMessageExecutionRuntime({
      appId: authEnv.AUTH_LARK_APP_ID || authEnv.AUTH_FEISHU_APP_ID,
      appSecret: authEnv.AUTH_LARK_APP_SECRET || authEnv.AUTH_FEISHU_APP_SECRET,
      userAccessToken,
    });
  }
  return runtime;
}
