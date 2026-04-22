import { systemPrompt } from '@lobechat/builtin-tool-web-browsing';
import { describe, expect, it } from 'vitest';

const DATE = '2026-04-22';

describe('webBrowsingSystemRole', () => {
  describe('Jemmia R2 priority logic', () => {
    it('should contain jemmia_diamond_knowledge_base section', () => {
      const prompt = systemPrompt(DATE);
      expect(prompt).toContain('<jemmia_diamond_knowledge_base>');
    });

    it('should instruct to crawl R2 first for Jemmia topics', () => {
      const prompt = systemPrompt(DATE);
      expect(prompt).toContain('Jemmia Diamond topics');
      expect(prompt).toContain('crawl R2 first');
    });

    it('should only use search when R2 has no answer', () => {
      const prompt = systemPrompt(DATE);
      expect(prompt).toContain("Only use 'search' if answer not found in R2 knowledge base");
    });
  });

  describe('structured workflow format', () => {
    it('should use Query Analysis header', () => {
      expect(systemPrompt(DATE)).toContain('**Query Analysis:**');
    });

    it('should use Execution Order header', () => {
      expect(systemPrompt(DATE)).toContain('**Execution Order:**');
    });
  });

  describe('citation rules', () => {
    it('should use Citation Rules header', () => {
      expect(systemPrompt(DATE)).toContain('**Citation Rules:**');
    });

    it('should use R2 Storage Links header', () => {
      expect(systemPrompt(DATE)).toContain('**R2 Storage Links:**');
    });

    it('should prohibit R2 storage URLs in footnotes', () => {
      expect(systemPrompt(DATE)).toContain('NEVER use R2 storage URLs in footnotes');
    });

    it('should prohibit crawl URLs in footnotes', () => {
      expect(systemPrompt(DATE)).toContain('NEVER use crawl URLs in footnotes');
    });

    it('should prohibit guessing or constructing Lark URLs', () => {
      expect(systemPrompt(DATE)).toContain('NEVER attempt to guess or construct a Lark URL');
    });

    it('should instruct no footnote when cite URL is missing', () => {
      expect(systemPrompt(DATE)).toContain('NO **cite** URL listed → do NOT add footnote');
    });
  });

  describe('knowledge base list', () => {
    it('should embed crawl URLs from buildKnowledgeBaseList', () => {
      const prompt = systemPrompt(DATE);
      expect(prompt).toContain('crawl:');
      expect(prompt).toContain('r2.cloudflarestorage.com');
    });

    it('should inject current date', () => {
      expect(systemPrompt(DATE)).toContain(DATE);
    });
  });
});
