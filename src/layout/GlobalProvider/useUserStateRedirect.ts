'use client';

import { useCallback } from 'react';

import { isDesktop } from '@/const/version';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { onboardingSelectors } from '@/store/user/selectors';
import { type UserInitializationState } from '@/types/user';

const redirectIfNotOn = (currentPath: string, path: string) => {
  if (!currentPath.startsWith(path)) {
    window.location.href = path;
  }
};

export const useDesktopUserStateRedirect = () => {
  // Desktop onboarding redirect is now handled by main process (BrowserManager)
  // No need to check localStorage here
  return useCallback(() => {}, []);
};

export const useWebUserStateRedirect = () => {
  const { enableOnboarding, forceOnboarding } = useServerConfigStore(featureFlagsSelectors);

  return useCallback(
    (state: UserInitializationState) => {
      const { pathname } = window.location;

      if (!enableOnboarding) return;

      if (forceOnboarding) {
        redirectIfNotOn(pathname, '/onboarding');
        return;
      }

      if (!onboardingSelectors.needsOnboarding(state)) return;

      redirectIfNotOn(pathname, '/onboarding');
    },
    [enableOnboarding, forceOnboarding],
  );
};

export const useUserStateRedirect = () => {
  const desktopRedirect = useDesktopUserStateRedirect();
  const webRedirect = useWebUserStateRedirect();

  return useCallback(
    (state: UserInitializationState) => {
      const redirect = isDesktop ? desktopRedirect : webRedirect;
      redirect(state);
    },
    [desktopRedirect, webRedirect],
  );
};
