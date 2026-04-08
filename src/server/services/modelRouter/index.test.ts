import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgenticVerifierService } from './AgenticVerifierService';
import { ModelRouterService } from './index';

describe('ModelRouterService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
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

    it('should verify responses with chunks', async () => {
      const verifySpy = vi
        .spyOn(AgenticVerifierService, 'verifyAnswer')
        .mockResolvedValue({ issues: [], isValid: true });

      const result = await ModelRouterService.verify({
        answer: 'test answer',
        chunks: [
          {
            content: 'chunk',
            fileId: 'f1',
            fileName: 'file.txt',
            id: '0',
            rawContent: '<chunk>chunk</chunk>',
            similarity: '0.1',
            source: 'file.txt',
          },
        ],
        modelId: 'gemini-2.5-pro',
        modelRuntime: {} as any,
        query: 'query',
      });

      expect(result.isValid).toBe(true);
      expect(verifySpy).toHaveBeenCalled();
      expect(verifySpy.mock.calls[0][0].modelId).toBe('gemini-2.5-flash-lite');
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
      expect(result.reason).toBe('fallback-gemini-fast');
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
