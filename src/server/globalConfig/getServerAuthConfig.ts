import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';

import { serverFeatureFlags } from '@/config/featureFlags';
import { appEnv } from '@/envs/app';
import { authEnv } from '@/envs/auth';
import { parseSSOProviders } from '@/libs/better-auth/utils/server';
import { type GlobalServerConfig } from '@/types/serverConfig';

const getBetterAuthSSOProviders = () => {
  const providers = parseSSOProviders(authEnv.AUTH_SSO_PROVIDERS);
  const flags = serverFeatureFlags();

  return providers.filter((provider) => {
    switch (provider) {
      case 'lark': {
        return flags.enableAuthSsoLark;
      }
      case 'google': {
        return flags.enableAuthSsoGoogle;
      }
      case 'github': {
        return flags.enableAuthSsoGithub;
      }
      default: {
        return true;
      }
    }
  });
};

export const getServerAuthConfig = (): GlobalServerConfig => {
  const flags = serverFeatureFlags();

  return {
    aiProvider: {},
    disableEmailPassword: authEnv.AUTH_DISABLE_EMAIL_PASSWORD || !flags.enableAuthEmailPassword,
    enableBusinessFeatures: ENABLE_BUSINESS_FEATURES,
    enableEmailVerification: authEnv.AUTH_EMAIL_VERIFICATION,
    enableMagicLink: authEnv.AUTH_ENABLE_MAGIC_LINK,
    enableMarketTrustedClient: !!(
      appEnv.MARKET_TRUSTED_CLIENT_SECRET && appEnv.MARKET_TRUSTED_CLIENT_ID
    ),
    oAuthSSOProviders: getBetterAuthSSOProviders(),
    showAuthThemeButton: flags.showAuthThemeButton,
    telemetry: {},
  };
};
