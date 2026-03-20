import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

import { account } from '@/database/schemas';
import { authEnv } from '@/envs/auth';

export interface LarkTokenRefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

async function getAppAccessToken() {
  const appId = authEnv.AUTH_LARK_APP_ID;
  const appSecret = authEnv.AUTH_LARK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('[LarkAuth] Missing AUTH_LARK_APP_ID or AUTH_LARK_APP_SECRET');
  }

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
  return data.app_access_token as string;
}

export async function refreshLarkUserAccessToken(
  refreshToken: string,
): Promise<LarkTokenRefreshResult | null> {
  try {
    const appAccessToken = await getAppAccessToken();

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

    console.error('[LarkAuth] Token refresh failed:', data);
    return null;
  } catch (error) {
    console.error('[LarkAuth] Token refresh error:', error);
    return null;
  }
}

export async function getLarkUserAccessToken(ctx: any): Promise<string | undefined> {
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
          console.info('[LarkAuth] Token expired, refreshing...');
          const newTokens = await refreshLarkUserAccessToken(larkAccount.refreshToken);

          if (newTokens) {
            await ctx.serverDB
              .update(account)
              .set({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken,
                accessTokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
                expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
                updatedAt: new Date(),
              })
              .where(
                and(eq(account.providerId, 'lark'), eq(account.accountId, larkAccount.accountId)),
              );

            userAccessToken = newTokens.accessToken;
          } else {
            userAccessToken = larkAccount.accessToken;
          }
        } else {
          userAccessToken = larkAccount.accessToken;
        }
      }
    }
  } catch (error) {
    console.error('[LarkAuth] Failed to fetch user access token:', error);
  }

  return userAccessToken;
}

export async function withLarkUserAccessToken<T>(
  ctx: any,
  handler: (accessToken?: string) => Promise<T>,
  isAuthError?: (error: any) => boolean,
): Promise<T> {
  const userAccessToken = await getLarkUserAccessToken(ctx);

  try {
    return await handler(userAccessToken);
  } catch (error: any) {
    if (!isAuthError || !isAuthError(error)) throw error;

    if (!ctx.userId || !ctx.serverDB) throw error;

    const larkAccount = await ctx.serverDB.query.account.findFirst({
      where: and(eq(account.userId, ctx.userId), eq(account.providerId, 'lark')),
    });

    if (!larkAccount?.refreshToken) throw error;

    const newTokens = await refreshLarkUserAccessToken(larkAccount.refreshToken);

    if (!newTokens) {
      await ctx.serverDB
        .update(account)
        .set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          expiresAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(account.providerId, 'lark'), eq(account.accountId, larkAccount.accountId)));

      throw new TRPCError({
        cause: error,
        code: 'UNAUTHORIZED',
        message: 'Lark authorization has expired or been revoked. Please sign in with Lark again.',
      });
    }

    await ctx.serverDB
      .update(account)
      .set({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        accessTokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        updatedAt: new Date(),
      })
      .where(and(eq(account.providerId, 'lark'), eq(account.accountId, larkAccount.accountId)));

    return await handler(newTokens.accessToken);
  }
}
