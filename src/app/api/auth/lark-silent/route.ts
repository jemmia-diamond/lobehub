import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

import { account, session, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { authEnv } from '@/envs/auth';

async function getAppAccessToken() {
  const res = await fetch(
    'https://open.larksuite.com/open-apis/auth/v3/app_access_token/internal',
    {
      body: JSON.stringify({
        app_id: authEnv.AUTH_LARK_APP_ID,
        app_secret: authEnv.AUTH_LARK_APP_SECRET,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  const data = await res.json();
  return data.app_access_token;
}

export const POST = async (req: Request) => {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    if (!authEnv.AUTH_LARK_APP_ID || !authEnv.AUTH_LARK_APP_SECRET) {
      return NextResponse.json({ error: 'Missing Lark App ID/Secret' }, { status: 500 });
    }

    const tokenRes = await fetch(
      'https://open.larksuite.com/open-apis/authen/v1/oidc/access_token',
      {
        body: JSON.stringify({
          code,
          grant_type: 'authorization_code',
        }),
        headers: {
          'Authorization': `Bearer ${await getAppAccessToken()}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        method: 'POST',
      },
    );

    const tokenData = await tokenRes.json();

    if (tokenData.code !== 0) {
      console.error('[Lark Silent Login] Token exchange failed:', tokenData);
      return NextResponse.json({ error: tokenData.msg }, { status: 400 });
    }

    const userInfoRes = await fetch('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: {
        Authorization: `Bearer ${tokenData.data.access_token}`,
      },
    });
    const userInfoData = await userInfoRes.json();
    const larkUser = userInfoData.data;

    const serverDB = await getServerDB();

    const existingAccount = await serverDB.query.account.findFirst({
      where: and(
        eq(account.providerId, 'lark'),
        eq(account.accountId, larkUser.open_id || tokenData.data.open_id),
      ),
    });

    let userId = existingAccount?.userId;

    if (!userId) {
      const [newUser] = await serverDB
        .insert(users)
        .values({
          id: nanoid(),
          createdAt: new Date(),
          email: larkUser.email || larkUser.enterprise_email,
          emailVerified: true,
          avatar: larkUser.avatar_url,
          username: larkUser.name,
          updatedAt: new Date(),
        })
        .returning();

      userId = newUser.id;

      await serverDB.insert(account).values({
        id: nanoid(),
        accessToken: tokenData.data.access_token,
        accountId: larkUser.open_id || tokenData.data.open_id,
        accessTokenExpiresAt: new Date(Date.now() + tokenData.data.expires_in * 1000),
        createdAt: new Date(),
        providerId: 'lark',
        refreshToken: tokenData.data.refresh_token,
        updatedAt: new Date(),
        userId,
      });
    } else {
      await serverDB
        .update(account)
        .set({
          accessToken: tokenData.data.access_token,
          accessTokenExpiresAt: new Date(Date.now() + tokenData.data.expires_in * 1000),
          refreshToken: tokenData.data.refresh_token,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(account.providerId, 'lark'),
            eq(account.accountId, larkUser.open_id || tokenData.data.open_id),
          ),
        );
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await serverDB.insert(session).values({
      id: nanoid(),
      createdAt: new Date(),
      expiresAt,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      token: sessionToken,
      updatedAt: new Date(),
      userAgent: req.headers.get('user-agent'),
      userId,
    });

    const response = NextResponse.json({ success: true });

    const isSecure = process.env.NODE_ENV === 'production';
    const cookieName = isSecure
      ? '__Secure-better-auth.session_token'
      : 'better-auth.session_token';

    response.cookies.set(cookieName, sessionToken, {
      expires: expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: isSecure,
    });

    return response;
  } catch (error) {
    console.error('[Lark Silent Login] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};
