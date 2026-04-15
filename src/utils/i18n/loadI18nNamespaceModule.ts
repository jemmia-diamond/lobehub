export interface LoadI18nNamespaceModuleParams {
  defaultLang: string;
  lng: string;
  normalizeLocale: (locale?: string) => string;
  ns: string;
}

export const loadI18nNamespaceModule = async (params: LoadI18nNamespaceModuleParams) => {
  const { normalizeLocale, lng, ns, defaultLang } = params;

  const normalizedLocale = normalizeLocale(lng);

  try {
    return import(`@/../locales/${normalizedLocale}/${ns}.json`);
  } catch (error) {
    try {
      return import(`@/../locales/${defaultLang}/${ns}.json`);
    } catch (innerError) {
      console.warn(
        `[i18n] Failed to load locale "${normalizedLocale}" or default "${defaultLang}" for namespace "${ns}". Falling back to TypeScript source.`,
        { error, innerError },
      );
      return import(`@/locales/default/${ns}`);
    }
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
