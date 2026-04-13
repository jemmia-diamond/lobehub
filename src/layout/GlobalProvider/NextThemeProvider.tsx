'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

interface NextThemeProviderProps {
  children: ReactNode;
}

export default function NextThemeProvider({ children }: NextThemeProviderProps) {
  return (
    <NextThemesProvider
      disableTransitionOnChange
      attribute="data-theme"
      defaultTheme="light"
      forcedTheme="light"
    >
      {children}
    </NextThemesProvider>
  );
}
