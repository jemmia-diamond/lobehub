import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

import { account } from '@/database/schemas';
import { authEnv } from '@/envs/auth';

export interface LarkTokenRefreshResult {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

export async function refreshLarkUserAccessToken(
  refreshToken: string,
): Promise<LarkTokenRefreshResult | null> {
  const appId = authEnv.AUTH_LARK_APP_ID;
  const appSecret = authEnv.AUTH_LARK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('[LarkAuth] Missing Lark App credentials for refresh');
    return null;
  }

  try {
    console.info('[LarkAuth] Attempting to refresh user access token...');

    const res = await fetch('https://open.larksuite.com/open-apis/authen/v2/oauth/token', {
      body: JSON.stringify({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
    });

    const data = await res.json();
    console.info('[LarkAuth] Token refresh response status:', res.status, 'code:', data.code);

    const payload = data.data ?? data;

    if (res.ok && payload.access_token) {
      console.info('[LarkAuth] Token refreshed successfully');
      return {
        accessToken: payload.access_token,
        expiresIn: payload.expires_in,
        refreshToken: payload.refresh_token,
      };
    }

    console.error('[LarkAuth] Token refresh failed with data:', JSON.stringify(data));
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
          accessTokenExpiresAt: null,
          expiresAt: null,
          refreshToken: null,
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
        accessTokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        expiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
        refreshToken: newTokens.refreshToken,
        updatedAt: new Date(),
      })
      .where(and(eq(account.providerId, 'lark'), eq(account.accountId, larkAccount.accountId)));

    return await handler(newTokens.accessToken);
  }
}
