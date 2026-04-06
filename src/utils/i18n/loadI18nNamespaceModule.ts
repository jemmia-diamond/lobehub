export interface LoadI18nNamespaceModuleParams {
  defaultLang: string;
  lng: string;
  normalizeLocale: (locale?: string) => string;
  ns: string;
}

export const loadI18nNamespaceModule = async (params: LoadI18nNamespaceModuleParams) => {
  const { normalizeLocale, lng, ns } = params;

  const normalizedLocale = normalizeLocale(lng);

  // English uses the TypeScript source files in src/locales/default/
  if (normalizedLocale === 'en-US') return import(`@/locales/default/${ns}`);

  // All other locales (including vi-VN) load from JSON translation files
  try {
    return import(`@/../locales/${normalizedLocale}/${ns}.json`);
  } catch {
    return import(`@/locales/default/${ns}`);
  }
};

export interface LoadI18nNamespaceModuleWithFallbackParams extends LoadI18nNamespaceModuleParams {
  onFallback?: (params: { error: unknown; lng: string; ns: string }) => void;
}

export const loadI18nNamespaceModuleWithFallback = async (
  params: LoadI18nNamespaceModuleWithFallbackParams,
) => {
  const { onFallback, ...rest } = params;

  try {
    return await loadI18nNamespaceModule(rest);
  } catch (error) {
    onFallback?.({ error, lng: rest.lng, ns: rest.ns });
    return import(`@/locales/default/${rest.ns}`);
  }
};
