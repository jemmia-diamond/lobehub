import { isDesktop } from '@lobechat/const';
import { Avatar } from '@lobehub/ui';
import {
  Blocks,
  Brain,
  ChartColumnBigIcon,
  Coins,
  CreditCard,
  Database,
  EllipsisIcon,
  EthernetPort,
  FlaskConical,
  Gift,
  Info,
  KeyboardIcon,
  KeyIcon,
  Map,
  PaletteIcon,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useElectronStore } from '@/store/electron';
import { electronSyncSelectors } from '@/store/electron/selectors';
import { SettingsTabs } from '@/store/global/initialState';
import {
  featureFlagsSelectors,
  serverConfigSelectors,
  useServerConfigStore,
} from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

export enum SettingsGroupKey {
  Agent = 'agent',
  General = 'general',
  Subscription = 'subscription',
  System = 'system',
}

export interface CategoryItem {
  icon: any;
  key: SettingsTabs;
  label: string;
}

export interface CategoryGroup {
  items: CategoryItem[];
  key: SettingsGroupKey;
  title: string;
}

export const useCategory = () => {
  const { t } = useTranslation('setting');
  const { t: tAuth } = useTranslation('auth');
  const { t: tSubscription } = useTranslation('subscription');
  const mobile = useServerConfigStore((s) => s.isMobile);
  const { enableSTT, hideDocs, showAiImage, showApiKeyManage, showProvider, enableSystemSettings } =
    useServerConfigStore(featureFlagsSelectors);
  const [avatar, username] = useUserStore((s) => [
    userProfileSelectors.userAvatar(s),
    userProfileSelectors.nickName(s),
  ]);
  const remoteServerUrl = useElectronStore(electronSyncSelectors.remoteServerUrl);

  const avatarUrl = useMemo(() => {
    if (!avatar) return undefined;
    if (isDesktop && avatar.startsWith('/') && remoteServerUrl) {
      return remoteServerUrl + avatar;
    }
    return avatar;
  }, [avatar, remoteServerUrl]);
  const enableBusinessFeatures = useServerConfigStore(serverConfigSelectors.enableBusinessFeatures);
  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const groups: CategoryGroup[] = [];

    // General group
    const generalItems: CategoryItem[] = [
      {
        icon: avatarUrl ? <Avatar avatar={avatarUrl} shape={'square'} size={26} /> : undefined,
        key: SettingsTabs.Profile,
        label: username || tAuth('tab.profile'),
      },
      {
        icon: PaletteIcon,
        key: SettingsTabs.Appearance,
        label: t('tab.appearance'),
      },
      !mobile && {
        icon: KeyboardIcon,
        key: SettingsTabs.Hotkey,
        label: t('tab.hotkey'),
      },
      showApiKeyManage && {
        icon: KeyIcon,
        key: SettingsTabs.APIKey,
        label: tAuth('tab.apikey'),
      },
    ].filter(Boolean) as CategoryItem[];

    groups.push({
      items: generalItems,
      key: SettingsGroupKey.General,
      title: t('group.common'),
    });

    // Subscription group
    if (enableBusinessFeatures) {
      const subscriptionItems: CategoryItem[] = [
        { icon: Map, key: SettingsTabs.Plans, label: tSubscription('tab.plans') },
        { icon: Coins, key: SettingsTabs.Credits, label: tSubscription('tab.credits') },
        { icon: CreditCard, key: SettingsTabs.Billing, label: tSubscription('tab.billing') },
        { icon: Gift, key: SettingsTabs.Referral, label: tSubscription('tab.referral') },
        { icon: ChartColumnBigIcon, key: SettingsTabs.Usage, label: t('tab.usage') },
      ];

      groups.push({
        items: subscriptionItems,
        key: SettingsGroupKey.Subscription,
        title: t('group.subscription'),
      });
    }

    // Account group - personal settings
    const commonItems: CategoryItem[] = [
      {
        icon: PaletteIcon,
        key: SettingsTabs.Common,
        label: t('tab.common'),
      },
      {
        icon: MessageSquareTextIcon,
        key: SettingsTabs.ChatAppearance,
        label: t('tab.chatAppearance'),
      },
      !mobile && {
        icon: KeyboardIcon,
        key: SettingsTabs.Hotkey,
        label: t('tab.hotkey'),
      },
    ].filter(Boolean) as CategoryItem[];

    groups.push({
      items: commonItems,
      key: SettingsGroupKey.Account,
      title: t('group.common'),
    });

    // AI configuration group - AI-related settings
    const aiConfigItems: CategoryItem[] = [
      showProvider && {
        icon: Brain,
        key: SettingsTabs.Provider,
        label: t('tab.provider'),
      },
      {
        icon: Sparkles,
        key: SettingsTabs.ServiceModel,
        label: t('tab.serviceModel'),
      },
      {
        icon: Blocks,
        key: SettingsTabs.Skill,
        label: t('tab.skill'),
      },
      showAiImage && {
        icon: ImageIcon,
        key: SettingsTabs.Image,
        label: t('tab.image'),
      },
      enableSTT && {
        icon: Mic2,
        key: SettingsTabs.TTS,
        label: t('tab.tts'),
      },
    ].filter(Boolean) as CategoryItem[];

    groups.push({
      items: agentItems,
      key: SettingsGroupKey.Agent,
      title: t('group.aiConfig'),
    });

    // System group
    const systemItems: CategoryItem[] = [
      enableSystemSettings &&
        isDesktop && {
          icon: EthernetPort,
          key: SettingsTabs.Proxy,
          label: t('tab.proxy'),
        },
      enableSystemSettings &&
        isDesktop && {
          icon: TerminalSquare,
          key: SettingsTabs.SystemTools,
          label: t('tab.systemTools'),
        },
      enableSystemSettings &&
        isDesktop && {
          icon: FlaskConical,
          key: SettingsTabs.Beta,
          label: t('tab.beta'),
        },
      enableSystemSettings && {
        icon: Database,
        key: SettingsTabs.Storage,
        label: t('tab.storage'),
      },
      enableSystemSettings && {
        icon: EllipsisIcon,
        key: SettingsTabs.Advanced,
        label: t('tab.advanced'),
      },
      !hideDocs && {
        icon: Info,
        key: SettingsTabs.About,
        label: t('tab.about'),
      },
    ].filter(Boolean) as CategoryItem[];

    groups.push({
      items: systemItems,
      key: SettingsGroupKey.System,
      title: t('group.system'),
    });

    return groups;
  }, [
    t,
    tAuth,
    tSubscription,
    enableSTT,
    enableBusinessFeatures,
    hideDocs,
    mobile,
    showApiKeyManage,
    showProvider,
    enableSystemSettings,
    avatarUrl,
    username,
  ]);

  return categoryGroups;
};