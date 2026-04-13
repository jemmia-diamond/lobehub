// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const loadI18nNamespaceModule = vi.fn(async ({ lng, ns }: { lng: string; ns: string }) => ({
  default: {
    key: `${lng}:${ns}`,
  },
}));

vi.mock('@/const/locale', () => ({
  DEFAULT_LANG: 'en-US',
}));

vi.mock('./loadI18nNamespaceModule', () => ({
  loadI18nNamespaceModule,
}));

describe('createI18nNext', () => {
  it('initializes synchronously with bundled fallback resources and reloads the actual language in background', async () => {
    const { createI18nNext } = await import('@/locales/create');

    const i18n = createI18nNext('vi-VN');
    const reloadSpy = vi.spyOn(i18n.instance, 'reloadResources');
    const initPromise = i18n.init({ initAsync: false });

    expect(i18n.instance.isInitialized).toBe(true);
    expect(i18n.instance.getResource('vi-VN', 'common', 'copy')).toBeDefined();

    await initPromise;
    await Promise.resolve();
    await Promise.resolve();

    expect(i18n.instance.hasResourceBundle('vi-VN', 'common')).toBe(true);
    expect(i18n.instance.hasResourceBundle('vi-VN', 'chat')).toBe(true);
    expect(i18n.instance.hasResourceBundle('vi-VN', 'error')).toBe(true);

    expect(reloadSpy).toHaveBeenCalledWith(
      ['vi-VN'],
      ['chat', 'common', 'error', 'file', 'home', 'topic', 'welcome'],
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'vi-VN', ns: 'common' }),
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'vi-VN', ns: 'chat' }),
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'vi-VN', ns: 'error' }),
    );
  });
});
