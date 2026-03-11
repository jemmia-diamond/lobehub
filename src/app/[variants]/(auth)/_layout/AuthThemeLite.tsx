'use client';

import 'antd/dist/reset.css';

import { ConfigProvider, ThemeProvider } from '@lobehub/ui';
import * as motion from 'motion/react-m';
import Link from 'next/link';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { memo } from 'react';

import AntdStaticMethods from '@/components/AntdStaticMethods';
import { useIsDark } from '@/hooks/useIsDark';
import Image from '@/libs/next/Image';

interface AuthThemeLiteProps extends PropsWithChildren {
  globalCDN?: boolean;
}

const AuthThemeLite = memo<AuthThemeLiteProps>(({ children, globalCDN }) => {
  const isDark = useIsDark();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentAppearance = mounted ? (isDark ? 'dark' : 'light') : 'light';

  return (
    <ThemeProvider
      appearance={currentAppearance}
      className={'auth-layout'}
      defaultAppearance={currentAppearance}
      defaultThemeMode={currentAppearance}
      style={{ height: '100%' }}
      theme={{
        cssVar: { key: 'lobe-vars' },
      }}
    >
      <AntdStaticMethods />
      <ConfigProvider
        motion={motion}
        config={{
          aAs: Link,
          imgAs: Image,
          imgUnoptimized: true,
          proxy: globalCDN ? 'unpkg' : undefined,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeProvider>
  );
});

AuthThemeLite.displayName = 'AuthThemeLite';

export default AuthThemeLite;
