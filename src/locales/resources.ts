import { DEFAULT_LANG } from '@/const/locale';

import type resources from './default';

export const locales = ['vi-VN', 'en-US', 'zh-CN', 'ar-SA'] as const;

export type DefaultResources = typeof resources;
export type NS = keyof DefaultResources;
export type Locales = (typeof locales)[number];

export const normalizeLocale = (locale?: string): Locales => {
  if (!locale) return DEFAULT_LANG;

  const normalized = locale.toLowerCase();

  if (normalized.startsWith('vi')) return 'vi-VN';
  if (normalized.startsWith('en')) return 'en-US';
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('ar')) return 'ar-SA';

  if (locales.includes(locale as any)) return locale as Locales;

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

export const supportLocales: string[] = ['vi-VN', 'en-US', 'zh-CN', 'ar-SA'];
