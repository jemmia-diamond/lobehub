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
        runtime.getDocMeta({ documentId: input.documentId }),
      );
    }),





  searchWiki: larkDocProcedure
    .input(
      z.object({
        pageSize: z.number().optional(),
        pageToken: z.string().optional(),
        query: z.string(),
        spaceId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkRuntime(ctx, (runtime) =>
        runtime.searchWiki({
          pageSize: input.pageSize,
          pageToken: input.pageToken,
          query: input.query,
          spaceId: input.spaceId,
        }),
      );
    }),
  listWikiSpaces: larkDocProcedure.query(async ({ ctx }) => {
    return await withLarkRuntime(ctx, (runtime) => runtime.listWikiSpaces());
  }),

  listWikiNodes: larkDocProcedure
    .input(
      z.object({
        pageToken: z.string().optional(),
        pageSize: z.number().optional().default(15),
        spaceId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await withLarkUserAccessToken(
        ctx,
        async (userAccessToken) => {
          const runtime = await getRuntime(userAccessToken);
          return runtime.listWikiNodes({
            pageToken: input.pageToken,
            pageSize: input.pageSize,
            spaceId: input.spaceId,
          });
        },
        (error) => {
          const message = String(error?.message || error || '');
          return message.includes('failed: 401');
        },
      );
    }),
});

async function getRuntime(userAccessToken?: string) {
  if (userAccessToken) {
    const { LarkDocExecutionRuntime } = await import('@lobechat/builtin-tool-lark-doc/executor');

    return new LarkDocExecutionRuntime({
      userAccessToken,
    });
  }
  
  return await larkDocRuntime.factory({ toolManifestMap: {} } as any);
}
