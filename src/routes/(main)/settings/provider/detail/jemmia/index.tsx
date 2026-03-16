'use client';

import { Markdown } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { JemmiaProviderCard } from 'model-bank/modelProviders';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FormPassword } from '@/components/FormInput';
import { SkeletonInput } from '@/components/Skeleton';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { type GlobalLLMProviderKey } from '@/types/user/settings';

import { useSettingsContext } from '../../../_layout/ContextProvider';
import { KeyVaultsConfigKey, LLMProviderApiTokenKey } from '../../const';
import { type ProviderItem } from '../../type';
import ProviderDetail from '../default';

const useStyles = createStaticStyles(({ css, cssVar }) => ({
  markdown: css`
    p {
      color: ${cssVar.colorTextDescription} !important;
    }
  `,
  tip: css`
    font-size: 12px;
    color: ${cssVar.colorTextDescription};
  `,
}));

const PROVIDER_KEY: GlobalLLMProviderKey = 'jemmia';

const useProviderCard = (): ProviderItem => {
  const { t } = useTranslation('modelProvider');
  const { styles } = useStyles();
  const { showJemmiaProxyUrl, showJemmiaApiKey } = useSettingsContext();

  const isLoading = useAiInfraStore(aiProviderSelectors.isAiProviderConfigLoading(PROVIDER_KEY));

  return useMemo(
    (): ProviderItem => ({
      ...JemmiaProviderCard,
      apiKeyItems: showJemmiaApiKey
        ? [
            {
              children: isLoading ? (
                <SkeletonInput />
              ) : (
                <FormPassword
                  autoComplete="new-password"
                  placeholder={t('jemmia.apiKey.placeholder')}
                />
              ),
              desc: (
                <Markdown className={styles.markdown} fontSize={12} variant="chat">
                  {t('jemmia.apiKey.desc')}
                </Markdown>
              ),
              label: t('jemmia.apiKey.title'),
              name: [KeyVaultsConfigKey, LLMProviderApiTokenKey],
            },
          ]
        : [],
      settings: {
        ...JemmiaProviderCard.settings,
        proxyUrl: showJemmiaProxyUrl
          ? {
              desc: t('jemmia.proxyUrl.desc'),
              placeholder: t('jemmia.proxyUrl.placeholder'),
              title: t('jemmia.proxyUrl.title'),
            }
          : undefined,
        showApiKey: showJemmiaApiKey,
      },
    }),
    [t, styles, showJemmiaApiKey, showJemmiaProxyUrl, isLoading],
  );
};

const Page = () => {
  const card = useProviderCard();

  return <ProviderDetail {...card} />;
};

export default Page;
