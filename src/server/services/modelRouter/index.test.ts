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
    expect(result.model).toBe('gemini-2.5-flash');
  });

  it('should route to STANDARD model if any standard tool is enabled', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Search something', role: 'user' }],
      tools: [{ identifier: 'some-tool' } as any],
    });
    expect(result.model).toBe('gemini-2.5-flash');
  });

  it('should route to PRO model for long history (> 15 messages)', () => {
    const messages = Array.from({ length: 16 }).map(() => ({ content: 'test', role: 'user' }));
    const result = ModelRouterService.resolve({
      messages,
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should route to PRO model when Lark Doc is detected in content (regardless of length)', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Please read Lark Document ID: doc123', role: 'user' }],
      tools: [],
    });
    expect(result.model).toBe('gemini-2.5-pro');
  });

  it('should route to PRO model when lobe-lark-doc tool is enabled', () => {
    const result = ModelRouterService.resolve({
      messages: [{ content: 'Search something', role: 'user' }],
      tools: [{ identifier: 'lobe-lark-doc' } as any],
    });
    expect(result.model).toBe('gemini-2.5-pro');
  });
});
