import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { type ReactNode, Suspense } from 'react';

import Analytics from '@/components/Analytics';
import { LarkSilentLogin } from '@/components/LarkSilentLogin';

const inVercel = process.env.VERCEL === '1';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html suppressHydrationWarning lang={'en'} style={{ height: '100%' }}>
      <head>
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
