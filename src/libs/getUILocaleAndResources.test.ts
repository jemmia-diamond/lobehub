import { describe, expect, it, vi } from 'vitest';

import { getUILocaleAndResources } from './getUILocaleAndResources';

describe('getUILocaleAndResources', () => {
  it('should return zh-CN locale and zhCn resources for zh-CN', async () => {
    const result = await getUILocaleAndResources('zh-CN');
    expect(result.locale).toBe('zh-CN');
    expect(result.resources).toBeDefined();
  });

  it('should return zh-CN locale for zh-TW (maps to zh-CN)', async () => {
    const result = await getUILocaleAndResources('zh-TW');
    expect(result.locale).toBe('zh-CN');
    expect(result.resources).toBeDefined();
  });

  it('should return en-US locale and en resources for en-US', async () => {
    const result = await getUILocaleAndResources('en-US');
    expect(result.locale).toBe('en-US');
    expect(result.resources).toBeDefined();
  });

  it('should return en-US locale and en resources for en', async () => {
    const result = await getUILocaleAndResources('en');
    expect(result.locale).toBe('en-US');
    expect(result.resources).toBeDefined();
  });

  it('should return vi-VN locale for auto (fallback)', async () => {
    const result = await getUILocaleAndResources('auto');
    expect(result.locale).toBe('vi-VN');
    expect(result.resources).toBeDefined();
  });

  it('should return ar-SA locale and custom resources for ar', async () => {
    const result = await getUILocaleAndResources('ar');
    expect(result.locale).toBe('ar-SA');
    expect(result.resources).toBeDefined();
  });

  it('should return vi-VN locale for de-DE (fallback)', async () => {
    const result = await getUILocaleAndResources('de-DE');
    expect(result.locale).toBe('vi-VN');
    expect(result.resources).toBeDefined();
  });

  it('should return vi-VN locale for es-ES (fallback)', async () => {
    const result = await getUILocaleAndResources('es-ES');
    expect(result.locale).toBe('vi-VN');
    expect(result.resources).toBeDefined();
  });

  it('should fallback to @lobehub/ui builtin resources if business ui.json is missing', async () => {
    vi.resetModules();
    vi.doMock('@/../locales/en-US/ui.json', () => ({ default: null }));

    const { getUILocaleAndResources: getWithFallback } = await import('./getUILocaleAndResources');
    const result = await getWithFallback('unknown-locale');
    expect(result.locale).toBe('vi-VN');
    expect(result.resources).toBeDefined();
  });
});
