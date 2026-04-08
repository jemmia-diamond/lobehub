import { DEFAULT_LANG } from '@/const/locale';

import type resources from './default';

export const locales = ['vi-VN'] as const;

export type DefaultResources = typeof resources;
export type NS = keyof DefaultResources;
export type Locales = (typeof locales)[number];

export const normalizeLocale = (locale?: string): Locales => {
  if (!locale) return DEFAULT_LANG;

  const normalized = locale.toLowerCase();

  if (normalized.startsWith('vi')) return 'vi-VN';

  return DEFAULT_LANG;
};

type LocaleOptions = {
  label: string;
  value: Locales;
}[];

export const localeOptions: LocaleOptions = [
  {
    label: 'Tiếng Việt',
    value: 'vi-VN',
  },
] as LocaleOptions;

export const supportLocales: string[] = ['vi-VN', 'vi'];
