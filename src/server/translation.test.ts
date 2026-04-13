// @vitest-environment node
import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LANG } from '@/const/locale';
import { normalizeLocale } from '@/locales/resources';

import { getLocale, translation } from './translation';

// Mock external dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/const/locale', () => ({
  DEFAULT_LANG: 'en-US',
  LOBE_LOCALE_COOKIE: 'LOBE_LOCALE',
}));

vi.mock('@/locales/resources', () => ({
  normalizeLocale: vi.fn((locale) => locale),
}));

vi.mock('@/utils/env', () => ({
  isDev: false,
}));

// Mock the i18n loader so tests don't depend on real JSON files on disk
const mockNamespaces: Record<string, Record<string, string>> = {
  common: {
    key1: 'Value 1',
    key2: 'Value 2 with {{param}}',
    'nested.key': 'Nested value',
    multiParam: 'Hello {{name}}, you have {{count}} messages',
    simpleText: 'Just a simple text',
    withParam: 'Text with {{param}}',
    'very.deeply.nested.key': 'Found the nested value',
  },
  chat: {
    welcome: 'Welcome to the chat',
  },
};

vi.mock('@/utils/i18n/loadI18nNamespaceModule', () => ({
  loadI18nNamespaceModuleWithFallback: vi.fn(async ({ ns, lng }: { ns: string; lng: string }) => {
    // For unknown locales, simulate fallback to default locale modules
    if (lng === 'zz-ZZ') {
      // Return the default module (models/providers have a default export)
      return import(`@/locales/default/${ns}`);
    }
    if (!mockNamespaces[ns]) throw new Error(`No mock for namespace: ${ns}`);
    return mockNamespaces[ns];
  }),
}));

// Mock default locale modules used as fallback for models/providers
vi.mock('@/locales/default/models', () => ({
  default: {
    'gpt-4.description': 'GPT-4 description',
  },
}));

vi.mock('@/locales/default/providers', () => ({
  default: {
    'openai.description': 'OpenAI provider description',
  },
}));

describe('getLocale', () => {
  const mockCookieStore = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockReturnValue(mockCookieStore);
  });

  it('should return the provided locale if hl is specified', async () => {
    const result = await getLocale('fr-FR');
    expect(result).toBe('fr-FR');
    expect(normalizeLocale).toHaveBeenCalledWith('fr-FR');
  });

  it('should return DEFAULT_LANG if no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getLocale();
    expect(result).toBe(DEFAULT_LANG);
  });
});

describe('translation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct translation object', async () => {
    const result = await translation('common', 'en-US');
    expect(result).toHaveProperty('locale', 'en-US');
    expect(result).toHaveProperty('t');
    expect(typeof result.t).toBe('function');
  });

  it('should translate keys correctly', async () => {
    const { t } = await translation('common', 'en-US');
    expect(t('key1')).toBe('Value 1');
    expect(t('key2', { param: 'test' })).toBe('Value 2 with test');
    expect(t('nested.key')).toBe('Nested value');
  });

  it('should handle multiple parameters in translation string', async () => {
    const { t } = await translation('common', 'en-US');
    expect(t('multiParam', { name: 'John', count: '5' })).toBe('Hello John, you have 5 messages');
  });

  it('should handle different namespaces', async () => {
    const { t } = await translation('chat', 'en-US');
    expect(t('welcome')).toBe('Welcome to the chat');
  });

  it('should handle dotted keys (flat structure with dots in key names)', async () => {
    const { t } = await translation('common', 'en-US');
    expect(t('very.deeply.nested.key')).toBe('Found the nested value');
  });

  it('should handle empty parameters object', async () => {
    const { t } = await translation('common', 'en-US');
    expect(t('simpleText', {})).toBe('Just a simple text');
  });

  it('should handle missing parameters in translation string', async () => {
    const { t } = await translation('common', 'en-US');
    // 当缺少参数时应保留占位符
    expect(t('withParam')).toBe('Text with {{param}}');
  });

  it('should return key when translation not found', async () => {
    const { t } = await translation('common', 'en-US');
    expect(t('nonexistent')).toBe('nonexistent');
  });

  it('should handle missing i18ns object gracefully', async () => {
    // Test the case where i18ns might be empty due to import failure
    const { t } = await translation('common', 'en-US');
    // When a key doesn't exist, it should return the key itself
    const result = t('totally.missing.key');
    expect(result).toBe('totally.missing.key');
  });

  it('should fallback to default module when locale JSON is missing (models)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { t } = await translation('models', 'zz-ZZ');
    expect(t('gpt-4.description')).toBe('GPT-4 description');
  });

  it('should fallback to default module when locale JSON is missing (providers)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { t } = await translation('providers', 'zz-ZZ');
    expect(t('openai.description')).toBe('OpenAI provider description');
  });
});
