import { WebOnboardingApiName, WebOnboardingManifest } from '@lobechat/builtin-tool-web-onboarding';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { finishOnboardingSpy, refreshUserStateSpy } = vi.hoisted(() => ({
  finishOnboardingSpy: vi.fn(),
  refreshUserStateSpy: vi.fn(),
}));

vi.mock('@/services/user', () => ({
  userService: {
    finishOnboarding: finishOnboardingSpy,
  },
}));

vi.mock('@/store/user', () => ({
  useUserStore: {
    getState: () => ({
      refreshUserState: refreshUserStateSpy,
    }),
  },
}));

vi.mock('@/store/agent', () => ({
  useAgentStore: {
    getState: () => ({
      refreshBuiltinAgent: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { webOnboardingExecutor } from './lobe-web-onboarding';

describe('webOnboardingExecutor', () => {
  beforeEach(() => {
    finishOnboardingSpy.mockReset();
    refreshUserStateSpy.mockReset();
  });

  it('publishes the renamed saveUserQuestion API', () => {
    expect(WebOnboardingApiName.saveUserQuestion).toBe('saveUserQuestion');
    expect('saveAnswer' in WebOnboardingApiName).toBe(false);
    expect(webOnboardingExecutor.hasApi(WebOnboardingApiName.saveUserQuestion)).toBe(true);
    expect(webOnboardingExecutor.hasApi('saveAnswer')).toBe(false);
  });

  it('publishes the flat saveUserQuestion manifest contract', () => {
    const saveUserQuestionApi = WebOnboardingManifest.api.find(
      (api) => api.name === WebOnboardingApiName.saveUserQuestion,
    );

    expect(saveUserQuestionApi).toMatchObject({
      description: expect.stringContaining('agentName and agentEmoji'),
      parameters: {
        additionalProperties: false,
        properties: {
          agentEmoji: { description: expect.any(String), type: 'string' },
          agentName: { description: expect.any(String), type: 'string' },
          fullName: { type: 'string' },
          interests: {
            items: { type: 'string' },
            type: 'array',
          },
          responseLanguage: { type: 'string' },
        },
        type: 'object',
      },
    });
  });

  it('calls finishOnboarding service and syncs user state', async () => {
    finishOnboardingSpy.mockResolvedValue({
      agentId: 'inbox-agent-1',
      success: true,
      topicId: 'topic-1',
    });

    const result = await webOnboardingExecutor.finishOnboarding({}, {} as any);

    expect(finishOnboardingSpy).toHaveBeenCalledTimes(1);
    expect(refreshUserStateSpy).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
