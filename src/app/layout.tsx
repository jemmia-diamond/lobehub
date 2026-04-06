import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { type ReactNode, Suspense } from 'react';

import Analytics from '@/components/Analytics';
import { LarkSilentLogin } from '@/components/LarkSilentLogin';

const inVercel = process.env.VERCEL === '1';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html suppressHydrationWarning lang={'vi-VN'} style={{ height: '100%' }}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <Script
          src="https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.5.23.js"
          strategy="beforeInteractive"
        />
      </head>
      <body style={{ height: '100%', margin: 0 }}>
        <LarkSilentLogin />
        {children}
        <Suspense fallback={null}>
          <Analytics />
          {inVercel && <SpeedInsights />}
        </Suspense>
      </body>
    </html>
  );
};

export default RootLayout;
