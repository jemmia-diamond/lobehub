// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const loadI18nNamespaceModule = vi.fn(async ({ lng, ns }: { lng: string; ns: string }) => ({
  default: {
    key: `${lng}:${ns}`,
  },
}));

vi.mock('@/const/locale', () => ({
  DEFAULT_LANG: 'vi-VN',
}));

vi.mock('./loadI18nNamespaceModule', () => ({
  loadI18nNamespaceModule,
}));

describe('createI18nNext', () => {
  it('initializes synchronously with bundled fallback resources and reloads the actual language in background', async () => {
    const { createI18nNext } = await import('@/locales/create');

    // Test with a non-default language (en-US) to verify background reload behavior
    const i18n = createI18nNext('en-US');
    const reloadSpy = vi.spyOn(i18n.instance, 'reloadResources');
    const initPromise = i18n.init({ initAsync: false });

    expect(i18n.instance.isInitialized).toBe(true);
    expect(i18n.instance.getResource('en-US', 'common', 'copy')).toBeDefined();

    await initPromise;
    await Promise.resolve();
    await Promise.resolve();

    expect(i18n.instance.hasResourceBundle('en-US', 'common')).toBe(true);
    expect(i18n.instance.hasResourceBundle('en-US', 'chat')).toBe(true);
    expect(i18n.instance.hasResourceBundle('en-US', 'error')).toBe(true);

    expect(reloadSpy).toHaveBeenCalledWith(
      ['en-US'],
      ['chat', 'common', 'editor', 'error', 'file', 'home', 'topic', 'welcome'],
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'en-US', ns: 'common' }),
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'en-US', ns: 'chat' }),
    );
    expect(loadI18nNamespaceModule).toHaveBeenCalledWith(
      expect.objectContaining({ lng: 'en-US', ns: 'error' }),
    );
  });

  it('does not reload resources when language is the default (vi-VN)', async () => {
    const { createI18nNext } = await import('@/locales/create');

    const i18n = createI18nNext('vi-VN');
    const reloadSpy = vi.spyOn(i18n.instance, 'reloadResources');
    const initPromise = i18n.init({ initAsync: false });

    expect(i18n.instance.isInitialized).toBe(true);
    expect(i18n.instance.getResource('vi-VN', 'common', 'copy')).toBeDefined();

    await initPromise;
    await Promise.resolve();
    await Promise.resolve();

    // vi-VN is the default — bundled resources are used, no background reload needed
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
