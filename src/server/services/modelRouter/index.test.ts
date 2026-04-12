import { describe, expect, it } from 'vitest';

import { ModelRouterService } from './index';

describe('ModelRouterService', () => {
  it('should route to FAST model for very simple, short chat (<= 5 messages)', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Hello', role: 'user' }],
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-flash-lite');
    expect(result.provider).toBe('jemmia');
  });

  it('should route to STANDARD model for moderate chat (> 5 messages)', () => {
    const messages = Array.from({ length: 6 }).map(() => ({ content: 'test', role: 'user' }));
    const result = ModelRouterService.resolve({
      messages,
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-flash-lite');
  });

  it('should route to FAST model if any standard tool is enabled', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Search something', role: 'user' }],
      tools: [{ identifier: 'some-tool' } as any],
    });
    expect(result.model).toBe('gemini-2.5-flash-lite');
  });

  it('should route to PRO model for high complexity (>= 3 files)', () => {
    const result = ModelRouterService.resolve({
      messages: [
        {
          content: [
            { type: 'image_url', image_url: { url: 'file1' } },
            { type: 'image_url', image_url: { url: 'file2' } },
            { type: 'image_url', image_url: { url: 'file3' } },
          ],
          role: 'user',
        },
      ],
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should route to THINKING model when Lark Doc is detected in content', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Please read Lark Document ID: doc123', role: 'user' }],
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-flash');
  });

  it('should route to THINKING model when lobe-lark-doc tool is enabled', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Search something', role: 'user' }],
      tools: [{ identifier: 'lobe-lark-doc' } as any],
    });
    expect(result.model).toBe('gemini-2.5-flash');
  });
});
