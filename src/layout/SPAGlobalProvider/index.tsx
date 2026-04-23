'use client';

import { TooltipGroup } from '@lobehub/ui';
import { StyleProvider } from 'antd-style';
import { domMax, LazyMotion } from 'motion/react';
import { lazy, memo, type PropsWithChildren, Suspense, useLayoutEffect } from 'react';

import { LobeAnalyticsProviderWrapper } from '@/components/Analytics/LobeAnalyticsProviderWrapper';
import { DragUploadProvider } from '@/components/DragUploadZone/DragUploadProvider';
import { isDesktop } from '@/const/version';
import AuthProvider from '@/layout/AuthProvider';
import AppTheme from '@/layout/GlobalProvider/AppTheme';
import DynamicFavicon from '@/layout/GlobalProvider/DynamicFavicon';
import { FaviconProvider } from '@/layout/GlobalProvider/FaviconProvider';
import { GroupWizardProvider } from '@/layout/GlobalProvider/GroupWizardProvider';
import ImportSettings from '@/layout/GlobalProvider/ImportSettings';
import NextThemeProvider from '@/layout/GlobalProvider/NextThemeProvider';
import QueryProvider from '@/layout/GlobalProvider/Query';
import ServerVersionOutdatedAlert from '@/layout/GlobalProvider/ServerVersionOutdatedAlert';
import StoreInitialization from '@/layout/GlobalProvider/StoreInitialization';
import { ServerConfigStoreProvider } from '@/store/serverConfig/Provider';
import type { SPAServerConfig } from '@/types/spaServerConfig';

import Locale from './Locale';
import SentryProvider from '@/layout/GlobalProvider/SentryProvider';

const ModalHost = lazy(() => import('@lobehub/ui').then((m) => ({ default: m.ModalHost })));
const ToastHost = lazy(() => import('@lobehub/ui/base-ui').then((m) => ({ default: m.ToastHost })));
const ContextMenuHost = lazy(() =>
  import('@lobehub/ui').then((m) => ({ default: m.ContextMenuHost })),
);

const SPAGlobalProvider = memo<PropsWithChildren>(({ children }) => {
  useLayoutEffect(() => {
    document.getElementById('loading-screen')?.remove();
    try {
      localStorage.removeItem('i18nextLng');
    } catch (e) {
      console.warn('[SPA] Failed to clear i18nextLng from localStorage:', e);
    }
  }, []);

  const serverConfig: SPAServerConfig | undefined = window.__SERVER_CONFIG__;

  const locale = document.documentElement.lang || 'vi-VN';
  const isMobile =
    (serverConfig?.isMobile ?? typeof __MOBILE__ !== 'undefined') ? __MOBILE__ : false;

  // Also detect mobile via viewport width for browser/Lark embedded access
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile || isMobileViewport) {
    return (
      <NextThemeProvider>
        <AppTheme>
          <div
            style={{
              alignItems: 'center',
              background: '#f8f8f8',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              height: '100dvh',
              justifyContent: 'center',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48 }}>💻</div>
            <div style={{ color: '#0a0a0a', fontSize: 20, fontWeight: 600 }}>
              Chưa hỗ trợ thiết bị di động
            </div>
            <div style={{ color: '#666', fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
              Brainy hiện chỉ hoạt động trên máy tính. Vui lòng truy cập trên trình duyệt desktop để sử dụng đầy đủ tính năng.
            </div>
          </div>
        </AppTheme>
      </NextThemeProvider>
    );
  }

  return (
    <Locale defaultLang={locale}>
      <NextThemeProvider>
        <AppTheme
          customFontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          customFontURL="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        >
          <ServerConfigStoreProvider
            featureFlags={serverConfig?.featureFlags}
            isMobile={isMobile}
            serverConfig={serverConfig?.config}
          >
            <QueryProvider>
              <AuthProvider>
                <StoreInitialization />

                {isDesktop && <ServerVersionOutdatedAlert />}
                <FaviconProvider>
                  <DynamicFavicon />
                  <GroupWizardProvider>
                    <DragUploadProvider>
                      <LazyMotion features={domMax}>
                        <TooltipGroup layoutAnimation={false}>
                          <StyleProvider speedy={import.meta.env.PROD}>
                            <LobeAnalyticsProviderWrapper>
                              <SentryProvider>
                                {children}
                              </SentryProvider>
                            </LobeAnalyticsProviderWrapper>
                          </StyleProvider>
                        </TooltipGroup>
                        <Suspense>
                          <ModalHost />
                          <ToastHost />
                          <ContextMenuHost />
                        </Suspense>
                      </LazyMotion>
                    </DragUploadProvider>
                  </GroupWizardProvider>
                </FaviconProvider>
              </AuthProvider>
            </QueryProvider>
            <Suspense>
              <ImportSettings />
              {/* DevPanel disabled in SPA: depends on node:fs */}
            </Suspense>
          </ServerConfigStoreProvider>
        </AppTheme>
      </NextThemeProvider>
    </Locale>
  );
});

SPAGlobalProvider.displayName = 'SPAGlobalProvider';

export default SPAGlobalProvider;
