import { describe, expect, it } from 'vitest';

import { ModelRouterService } from './index';

describe('ModelRouterService', () => {
  describe('resolve', () => {
    it('should route to FAST model when "fast" is explicitly requested', () => {
      const result = ModelRouterService.resolve({
        mode: 'fast',
      });
      expect(result.model).toBe('gemini-2.5-flash-lite');
      expect(result.reason).toBe('explicit-fast');
    });

    it('should route to THINKING model when "thinking" is explicitly requested', () => {
      const result = ModelRouterService.resolve({
        mode: 'thinking',
      });
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.reason).toBe('explicit-thinking');
    });

    it('should route to EXPERT model when "expert" is explicitly requested', () => {
      const result = ModelRouterService.resolve({
        mode: 'expert',
      });
      expect(result.model).toBe('gemini-2.5-pro');
      expect(result.reason).toBe('explicit-expert');
    });

    it('should support OpenAI variant model names', () => {
      const result = ModelRouterService.resolve({
        mode: 'openai-fast',
      });
      expect(result.model).toBe('gpt-4o-mini');
    });

    it('should fallback to FAST for unrecognized modes', () => {
      const result = ModelRouterService.resolve({
        mode: 'unrecognized-mode',
      });
      expect(result.model).toBe('gemini-2.5-flash-lite');
      expect(result.reason).toBe('explicit-fallback');
    });
  });

  describe('evaluate', () => {
    it('should route to the model returned by evaluate', async () => {
      const mockRuntime = {
        generateObject: async () => ({ modelId: 'gemini-2.5-pro' }),
      } as any;

      const result = await ModelRouterService.evaluate({
        messages: [{ content: 'test', role: 'user' }],
        modelRuntime: mockRuntime,
        tools: [],
      });

      expect(result.model).toBe('gemini-2.5-pro');
    });

    it('should fallback to FAST if evaluate fails', async () => {
      const mockRuntime = {
        generateObject: async () => {
          throw new Error('fail');
        },
      } as any;

      const result = await ModelRouterService.evaluate({
        messages: [{ content: 'Hello', role: 'user' }],
        modelRuntime: mockRuntime,
        tools: [],
      });

      expect(result.model).toBe('gemini-2.5-flash-lite');
      expect(result.reason).toBe('fallback-fast');
    });

    it('should handle regex fallback if generateObject returns text instead of object', async () => {
      const mockRuntime = {
        generateObject: async () => 'Selected: gemini-2.5-pro because of complexity',
      } as any;

      const result = await ModelRouterService.evaluate({
        messages: [{ content: 'test', role: 'user' }],
        modelRuntime: mockRuntime,
        tools: [],
      });

      expect(result.model).toBe('gemini-2.5-pro');
    });
  });
});
