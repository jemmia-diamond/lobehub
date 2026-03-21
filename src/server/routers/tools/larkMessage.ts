import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { account } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { larkMessageRuntime } from '@/server/services/toolExecution/serverRuntimes/larkMessage';

const larkMessageProcedure = authedProcedure.use(serverDatabase);

// Helper to get App Access Token (needed for token refresh)
async function getAppAccessToken(appId: string, appSecret: string) {
  const res = await fetch(
    'https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal',
    {
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  const data = await res.json();
  return data.app_access_token;
}

// Helper to refresh user access token
async function refreshUserAccessToken(refreshToken: string, appId: string, appSecret: string) {
  try {
    const appAccessToken = await getAppAccessToken(appId, appSecret);

    const res = await fetch(
      'https://open.larksuite.com/open-apis/authen/v1/oidc/refresh_access_token',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${appAccessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      },
    );

    const data = await res.json();

    if (data.code === 0) {
      return {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresIn: data.data.expires_in,
      };
    }
    console.error('[LarkMessageRouter] Token refresh failed:', data);
    return null;
  } catch (error) {
    console.error('[LarkMessageRouter] Token refresh error:', error);
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
  } catch (error) {
    console.error('[LarkMessageRouter] Failed to fetch user access token:', error);
  }
  return userAccessToken;
}

export const larkMessageRouter = router({
  findUser: larkMessageProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userAccessToken = await getUserAccessToken(ctx);
      const runtime = await getRuntime(userAccessToken);
      return await runtime.findUser({ query: input.query });
    }),

  getChats: larkMessageProcedure
    .input(
      z.object({
        chatType: z.enum(['p2p', 'group']).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const userAccessToken = await getUserAccessToken(ctx);
      const runtime = await getRuntime(userAccessToken);
      return await runtime.getChats({ chatType: input.chatType });
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
      const userAccessToken = await getUserAccessToken(ctx);
      const runtime = await getRuntime(userAccessToken);
      return await runtime.getMessages({
        chatId: input.chatId,
        startTime: input.startTime,
        endTime: input.endTime,
      });
    }),
});

async function getRuntime(userAccessToken?: string) {
  const runtime = larkMessageRuntime.factory({ toolManifestMap: {} });

  if (userAccessToken) {
    const { LarkMessageExecutionRuntime } =
      await import('@lobechat/builtin-tool-lark-message/executor');

    return new LarkMessageExecutionRuntime({
      userAccessToken,
    });
  }
  return runtime;
}
