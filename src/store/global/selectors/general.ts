import { DEFAULT_LANG } from '@/const/locale';
import { type Locales, normalizeLocale } from '@/locales/resources';
import { isOnServerSide } from '@/utils/env';

import { type GlobalState } from '../initialState';
import { systemStatus } from './systemStatus';

const language = (s: GlobalState) => systemStatus(s).language || 'auto';

const currentLanguage = (s: GlobalState): Locales => {
  const locale = language(s);

  if (locale === 'auto') {
    if (isOnServerSide) return DEFAULT_LANG;

    return normalizeLocale(navigator.language);
  }

  return normalizeLocale(locale);
};

export const globalGeneralSelectors = {
  currentLanguage,
  language,
};
