import * as agentRuntime from '@lobechat/agent-runtime';
import { describe, expect, it, vi } from 'vitest';

import { JEMMIA_MODELS, selectJemmiaModel } from './orchestrator';

vi.mock('@lobechat/agent-runtime', () => ({
  calculateMessageTokens: vi.fn(),
}));

describe('selectJemmiaModel', () => {
  it('should select FAST for simple chat', () => {
    vi.mocked(agentRuntime.calculateMessageTokens).mockReturnValue(100);

    const payload: any = {
      messages: [{ role: 'user', content: 'hello' }],
    };

    const model = selectJemmiaModel(payload);
    expect(model).toBe(JEMMIA_MODELS.FAST);
  });

  it('should select THINKING for medium context (>16k tokens)', () => {
    vi.mocked(agentRuntime.calculateMessageTokens)
      .mockReturnValueOnce(0) // system
      .mockReturnValueOnce(128001); // conversation

    const payload: any = {
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'a'.repeat(128001) },
      ],
    };

    const model = selectJemmiaModel(payload);
    expect(model).toBe(JEMMIA_MODELS.THINKING);
  });

  it('should select EXPERT for large context (>32k tokens)', () => {
    vi.mocked(agentRuntime.calculateMessageTokens)
      .mockReturnValueOnce(0) // system
      .mockReturnValueOnce(256001); // conversation

    const payload: any = {
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'a'.repeat(256001) },
      ],
    };

    const model = selectJemmiaModel(payload);
    expect(model).toBe(JEMMIA_MODELS.EXPERT);
  });

  it('should select THINKING for attachments', () => {
    vi.mocked(agentRuntime.calculateMessageTokens).mockReturnValue(100);

    const payload: any = {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'check this' },
            { type: 'file_url', file_url: '...' },
          ],
        },
      ],
    };

    const model = selectJemmiaModel(payload);
    expect(model).toBe(JEMMIA_MODELS.THINKING);
  });
});
