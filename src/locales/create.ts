import type { Resource } from 'i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';
import { isRtlLang } from 'rtl-detect';

// Sync load default language (vi-VN) from JSON to avoid Suspense on first render.
// locales/default/*.ts is for type inference only, not used as runtime values.
import chat from '@/../locales/vi-VN/chat.json';
import common from '@/../locales/vi-VN/common.json';
import error from '@/../locales/vi-VN/error.json';
import file from '@/../locales/vi-VN/file.json';
import home from '@/../locales/vi-VN/home.json';
import topic from '@/../locales/vi-VN/topic.json';
import welcome from '@/../locales/vi-VN/welcome.json';
import { DEFAULT_LANG } from '@/const/locale';
import { getDebugConfig } from '@/envs/debug';
import { normalizeLocale } from '@/locales/resources';
import { isOnServerSide } from '@/utils/env';
import { unwrapESMModule } from '@/utils/esm/unwrapESMModule';

import { loadI18nNamespaceModule } from '../utils/i18n/loadI18nNamespaceModule';

const createBundledResources = () => ({
  chat: { ...chat },
  common: { ...common },
  error: { ...error },
  file: { ...file },
  home: { ...home },
  topic: { ...topic },
  welcome: { ...welcome },
});

const defaultResources = createBundledResources();
const bundledNamespaces = Object.keys(defaultResources);

const { I18N_DEBUG, I18N_DEBUG_BROWSER, I18N_DEBUG_SERVER } = getDebugConfig();
const debugMode = (I18N_DEBUG ?? isOnServerSide) ? I18N_DEBUG_SERVER : I18N_DEBUG_BROWSER;

export const createI18nNext = (lang?: string) => {
  const instance = i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(
      resourcesToBackend(async (lng: string, ns: string) => {
        return unwrapESMModule(
          await loadI18nNamespaceModule({
            defaultLang: DEFAULT_LANG,
            lng,
            normalizeLocale,
            ns,
          }),
        );
      }),
    );
  // Dynamically set HTML direction on language change
  instance.on('languageChanged', (lng) => {
    if (typeof window !== 'undefined') {
      const direction = isRtlLang(lng) ? 'rtl' : 'ltr';
      document.documentElement.dir = direction;
    }
  });
  return {
    init: (params: { initAsync?: boolean } = {}) => {
      const { initAsync = true } = params;
      const initialLang = normalizeLocale(lang);
      const bundledLanguageResources: Resource = {
        [DEFAULT_LANG]: defaultResources,
      };

      if (initialLang !== DEFAULT_LANG) {
        bundledLanguageResources[initialLang] = createBundledResources();
      }

      const initPromise = instance.init({
        debug: debugMode,
        defaultNS: ['error', 'common', 'chat'],
        fallbackLng: DEFAULT_LANG,
        initAsync,
        // Keep init synchronous so components can render with bundled vi-VN resources
        // before the user's actual language finishes loading in the background.
        ns: [],

        // Preload default language (vi-VN) synchronously to avoid Suspense on first render
        resources: {
          ...bundledLanguageResources,
        } as any,
        // Keep backend loading enabled for namespaces that are not preloaded above.
        partialBundledLanguages: true,

        interpolation: {
          escapeValue: false,
        },
        keySeparator: false,
        lng: initialLang,
        react: {
          bindI18nStore: 'added',
          useSuspense: false,
        },
      });

      if (initialLang !== DEFAULT_LANG) {
        initPromise.then(() => {
          void instance.reloadResources([initialLang], bundledNamespaces);
        });
      }

      return initPromise;
    },
    instance,
  };
};
