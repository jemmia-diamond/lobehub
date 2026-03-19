'use client';

import { useEffect, useRef } from 'react';

import { useSession } from '@/libs/better-auth/auth-client';

export const useLarkSilentLogin = () => {
  const { data: session, isPending } = useSession();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (session || isPending || checkingRef.current) return;

    const isLarkClient = typeof window !== 'undefined' && !!window.h5sdk;

    if (!isLarkClient) return;

    const silentLogin = async () => {
      try {
        checkingRef.current = true;
        console.info('[Lark Silent Login] Detected Lark Client, attempting silent login...');

        const code = await new Promise<string>((resolve, reject) => {
          window.h5sdk!.tt.login({
            success(res) {
              console.info('[Lark Silent Login] Got auth code:', res.code);
              resolve(res.code);
            },
            fail(err) {
              console.error('[Lark Silent Login] tt.login failed:', err);
              reject(err);
            },
          });
        });

        if (!code) return;

        const res = await fetch('/api/auth/lark-silent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          console.info('[Lark Silent Login] Login successful, reloading...');
          window.location.reload();
        } else {
          console.error('[Lark Silent Login] Server rejected login:', await res.text());
        }
      } catch (error) {
        console.error('[Lark Silent Login] Error:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    silentLogin();
  }, [session, isPending]);
};
