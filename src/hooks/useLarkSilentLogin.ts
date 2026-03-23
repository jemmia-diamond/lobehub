'use client';

import { useEffect, useRef } from 'react';

import { useSession } from '@/libs/better-auth/auth-client';

export const useLarkSilentLogin = () => {
  const { data: session, isPending } = useSession();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (session || isPending || checkingRef.current) return;

    if (typeof window === 'undefined') return;

    const attempted = window.localStorage.getItem('lark_silent_login_done') === '1';
    if (attempted) return;

    const isLarkClient = !!window.h5sdk;

    if (!isLarkClient) return;

    const executeLogin = async () => {
      try {
        checkingRef.current = true;
        console.info('[Lark Silent Login] Detected Lark Client, attempting silent login...');

        const code = await new Promise<string | null>((resolve) => {
          if (typeof window.h5sdk?.tt?.login !== 'function') {
            console.warn(
              '[Lark Silent Login] window.h5sdk.tt.login is not available, skipping silent login',
            );
            resolve(null);
            return;
          }

          window.h5sdk.tt.login({
            success(res: any) {
              console.info('[Lark Silent Login] Got auth code:', res.code);
              resolve(res.code);
            },
            fail(err: any) {
              console.error('[Lark Silent Login] tt.login failed:', err);
              resolve(null);
            },
          });
        });

        if (!code) {
          window.localStorage.setItem('lark_silent_login_done', '1');
          return;
        }

        const res = await fetch('/api/auth/lark-silent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          window.localStorage.setItem('lark_silent_login_done', '1');
          console.info('[Lark Silent Login] Login successful, reloading...');
          window.location.reload();
        } else {
          window.localStorage.setItem('lark_silent_login_done', '1');
          console.error('[Lark Silent Login] Server rejected login:', await res.text());
        }
      } catch (error) {
        console.error('[Lark Silent Login] Error:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    const silentLogin = () => {
      const h5 = (window as any).h5sdk;
      if (h5 && typeof h5.ready === 'function') {
        h5.ready(() => {
          executeLogin();
        });
      } else {
        executeLogin();
      }
    };

    silentLogin();
  }, [session, isPending]);
};
