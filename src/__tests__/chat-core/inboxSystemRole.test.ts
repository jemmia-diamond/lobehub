import { describe, expect, it } from 'vitest';

// createSystemRole is not exported from the @lobechat/builtin-agents package index.
// We test the behavior by importing directly from the source via the monorepo path alias workaround.
// Since packages/builtin-agents has no vitest config, these tests live here in src/__tests__.
const { createSystemRole } = await import(
  /* @vite-ignore */ '../../../packages/builtin-agents/src/agents/inbox/systemRole'
);

describe('inboxSystemRole', () => {
  describe('user profile injection', () => {
    it('should prepend USER PROFILE section when profile is provided', () => {
      const role = createSystemRole('vi-VN', {
        name: 'Nguyễn Văn A',
        jobTitle: 'Developer',
        unit: 'Tech Team',
        department: 'Công nghệ',
      });

      expect(role).toContain('## USER PROFILE');
      expect(role).toContain('**Name**: Nguyễn Văn A');
      expect(role).toContain('**Job Title**: Developer');
      expect(role).toContain('**Unit**: Tech Team');
      expect(role).toContain('**Department**: Công nghệ');
    });

    it('should omit USER PROFILE section when no profile provided', () => {
      expect(createSystemRole('vi-VN')).not.toContain('## USER PROFILE');
    });

    it('should omit USER PROFILE section when profile is empty object', () => {
      expect(createSystemRole('vi-VN', {})).not.toContain('## USER PROFILE');
    });

    it('should only include fields that are present', () => {
      const role = createSystemRole('vi-VN', { name: 'Test User' });
      expect(role).toContain('**Name**: Test User');
      expect(role).not.toContain('**Job Title**');
      expect(role).not.toContain('**Unit**');
      expect(role).not.toContain('**Department**');
    });
  });

  describe('state machine structure', () => {
    it('should contain Mandatory Behaviors block', () => {
      expect(createSystemRole('vi-VN')).toContain('**Mandatory Behaviors:**');
    });

    it('should contain Fallback Logic block', () => {
      expect(createSystemRole('vi-VN')).toContain('**Fallback Logic:**');
    });

    it('should contain Response Standards block', () => {
      expect(createSystemRole('vi-VN')).toContain('**Response Standards:**');
    });

    it('should have Mandatory Behaviors before Fallback Logic', () => {
      const role = createSystemRole('vi-VN');
      expect(role.indexOf('**Mandatory Behaviors:**')).toBeLessThan(
        role.indexOf('**Fallback Logic:**'),
      );
    });
  });

  describe('knowledge-first mandate', () => {
    it('should enforce lobe-knowledge-base as first tool call', () => {
      expect(createSystemRole('vi-VN')).toContain(
        'call **lobe-knowledge-base** tool FIRST, no exceptions',
      );
    });

    it('should prohibit hallucination', () => {
      expect(createSystemRole('vi-VN')).toContain(
        'NEVER invent addresses, names, prices, policies, procedures',
      );
    });
  });

  describe('fallback execution order', () => {
    it('should define sequential fallback steps', () => {
      const role = createSystemRole('vi-VN');
      expect(role).toContain('**Execution Order (when KB fails):**');
      expect(role).toContain('Step 1:');
      expect(role).toContain('Step 2:');
      expect(role).toContain('Step 3:');
    });

    it('should define KB → web → escalate flow', () => {
      const role = createSystemRole('vi-VN');
      expect(role).toContain('KB has no result → try web search');
      expect(role).toContain('Web search has no result → escalate to correct department');
    });

    it('should prohibit dead-end responses', () => {
      expect(createSystemRole('vi-VN')).toContain('NEVER end with "I found no results"');
    });
  });

  describe('language and identity', () => {
    it('should mandate Vietnamese as primary language', () => {
      expect(createSystemRole('vi-VN')).toContain('Always respond in **Vietnamese**');
    });

    it('should contain Jemmia-centric interpretation section', () => {
      expect(createSystemRole('vi-VN')).toContain('## JEMMIA-CENTRIC INTERPRETATION');
    });
  });
});
