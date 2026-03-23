import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { withLarkUserAccessToken } from '@/server/services/larkAuth';
import { larkDocRuntime } from '@/server/services/toolExecution/serverRuntimes/larkDoc';

const larkDocProcedure = authedProcedure.use(serverDatabase);

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

export const larkDocRouter = router({
  getDocContent: larkDocProcedure
    .input(
      z.object({
        documentId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.getDocContent({ documentId: input.documentId }),
      );
    }),

  getDocMeta: larkDocProcedure
    .input(
      z.object({
        documentId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.getDocMetaRaw({ documentId: input.documentId }),
      );
    }),

  listDocs: larkDocProcedure
    .input(
      z.object({
        folderToken: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.listDocsRaw({ folderToken: input.folderToken }),
      );
    }),

  searchDocs: larkDocProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().optional().default(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.searchDocsRaw({ query: input.query, page: input.page }),
      );
    }),
});

async function getRuntime(userAccessToken?: string) {
  const runtime = larkDocRuntime.factory({ toolManifestMap: {} });

  if (userAccessToken) {
    const { LarkDocExecutionRuntime } = await import('@lobechat/builtin-tool-lark-doc/executor');
    const { authEnv } = await import('@/envs/auth');

    return new LarkDocExecutionRuntime({
      appId: authEnv.AUTH_LARK_APP_ID,
      appSecret: authEnv.AUTH_LARK_APP_SECRET,
      userAccessToken,
    });
  }
  return runtime;
}
