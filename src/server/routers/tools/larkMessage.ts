import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { account } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { larkMessageRuntime } from '@/server/services/toolExecution/serverRuntimes/larkMessage';

const larkMessageProcedure = authedProcedure.use(serverDatabase);

async function getAppAccessToken(appId: string, appSecret: string) {
  const baseUrl = process.env.AUTH_FEISHU_APP_ID
    ? 'https://open.feishu.cn/open-apis'
    : 'https://open.larksuite.com/open-apis';
  const res = await fetch(`${baseUrl}/auth/v3/app_access_token/internal`, {
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const data = await res.json();
  return data.app_access_token;
}

async function refreshUserAccessToken(refreshToken: string, appId: string, appSecret: string) {
  try {
    const baseUrl = process.env.AUTH_FEISHU_APP_ID
      ? 'https://open.feishu.cn/open-apis'
      : 'https://open.larksuite.com/open-apis';
    const appAccessToken = await getAppAccessToken(appId, appSecret);

    const res = await fetch(`${baseUrl}/authen/v1/oidc/refresh_access_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();

    if (data.code === 0) {
      return {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresIn: data.data.expires_in,
      };
    }
    return null;
  } catch (e) {
    console.error('[LarkRouter] refreshUserAccessToken error:', e);
    return null;
  }
}

async function getUserAccessToken(ctx: any) {
  let userAccessToken: string | undefined;
  try {
    if (ctx.userId && ctx.serverDB) {
      const larkAccount = await ctx.serverDB.query.account.findFirst({
        where: and(eq(account.userId, ctx.userId), eq(account.providerId, 'lark')),
      });

      if (larkAccount) {
        const now = new Date();
        const expiresAt = larkAccount.accessTokenExpiresAt || larkAccount.expiresAt;
        const isExpired = expiresAt
          ? new Date(expiresAt).getTime() - now.getTime() < 5 * 60 * 1000
          : false;

        if (isExpired && larkAccount.refreshToken) {
          const { authEnv } = await import('@/envs/auth');
          if (authEnv.AUTH_LARK_APP_ID && authEnv.AUTH_LARK_APP_SECRET) {
            const newTokens = await refreshUserAccessToken(
              larkAccount.refreshToken,
              authEnv.AUTH_LARK_APP_ID,
              authEnv.AUTH_LARK_APP_SECRET,
            );

            if (newTokens) {
              await ctx.serverDB
                .update(account)
                .set({
                  accessToken: newTokens.accessToken,
                  accessTokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
                  expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
                  refreshToken: newTokens.refreshToken,
                  updatedAt: new Date(),
                })
                .where(
                  and(eq(account.providerId, 'lark'), eq(account.accountId, larkAccount.accountId)),
                );

              userAccessToken = newTokens.accessToken;
            } else {
              userAccessToken = larkAccount.accessToken;
            }
          }
        } else {
          userAccessToken = larkAccount.accessToken;
        }
      }
    }
  } catch (e) {
    console.error('[LarkRouter] getUserAccessToken error:', e);
  }
  return userAccessToken;
}

export const larkMessageRouter = router({
  searchEmployees: larkMessageProcedure
    .input(
      z.object({
        pageSize: z.number().optional(),
        pageToken: z.string().optional(),
        query: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const userAccessToken = await getUserAccessToken(ctx);
        const runtime = await getRuntime(userAccessToken);
        return await runtime.searchEmployees(input);
      } catch (e) {
        console.error('[LarkRouter] searchEmployees error:', e);
        return { content: `Error: ${e}`, success: false };
      }
    }),

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
      try {
        const userAccessToken = await getUserAccessToken(ctx);
        const runtime = await getRuntime(userAccessToken);
        return await runtime.getChats({
          pageSize: input.pageSize,
          pageToken: input.pageToken,
          sortType: input.sortType,
          userIdType: input.userIdType,
        });
      } catch (e) {
        console.error('[LarkRouter] getChats error:', e);
        return { content: `Error: ${e}`, success: false };
      }
    }),

  getMessages: larkMessageProcedure
    .input(
      z.object({
        chatId: z.string(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const userAccessToken = await getUserAccessToken(ctx);
        const runtime = await getRuntime(userAccessToken);
        return await runtime.getMessages({
          chatId: input.chatId,
          startTime: input.startTime,
          endTime: input.endTime,
        });
      } catch (e) {
        console.error('[LarkRouter] getMessages error:', e);
        return { content: `Error: ${e}`, success: false };
      }
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
