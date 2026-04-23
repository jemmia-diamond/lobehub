import { describe, expect, it } from 'vitest';

import {
  buildKnowledgeBaseList,
  getLarkUrlForR2,
  JEMMIA_KNOWLEDGE_FILES,
  R2_TO_LARK_MAP,
} from './r2ToLarkMapping';

describe('r2ToLarkMapping — single source of truth', () => {
  describe('JEMMIA_KNOWLEDGE_FILES structure', () => {
    it('should have at least one entry', () => {
      expect(Object.keys(JEMMIA_KNOWLEDGE_FILES).length).toBeGreaterThan(0);
    });

    it('should have .md extension for all filenames', () => {
      for (const filename of Object.keys(JEMMIA_KNOWLEDGE_FILES)) {
        expect(filename).toMatch(/\.md$/);
      }
    });

    it('should have label and larkUrl for every entry', () => {
      for (const [, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
        expect(typeof entry.larkUrl).toBe('string');
      }
    });

    it('should use valid Lark URL format when larkUrl is non-empty', () => {
      for (const [, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        if (entry.larkUrl) {
          expect(entry.larkUrl).toMatch(/^https:\/\/jemmiadiamond\.sg\.larksuite\.com\/wiki\//);
        }
      }
    });
  });

  describe('R2_TO_LARK_MAP', () => {
    it('should contain all filenames from JEMMIA_KNOWLEDGE_FILES', () => {
      for (const filename of Object.keys(JEMMIA_KNOWLEDGE_FILES)) {
        expect(R2_TO_LARK_MAP).toHaveProperty(filename);
      }
    });

    it('should map each filename to its larkUrl (empty string when not set)', () => {
      for (const [filename, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        expect(R2_TO_LARK_MAP[filename]).toBe(entry.larkUrl);
      }
    });
  });

  describe('buildKnowledgeBaseList', () => {
    it('should include a crawl URL for every file', () => {
      const list = buildKnowledgeBaseList();
      const crawlCount = (list.match(/crawl:/g) || []).length;
      expect(crawlCount).toBe(Object.keys(JEMMIA_KNOWLEDGE_FILES).length);
    });

    it('should include all labels', () => {
      const list = buildKnowledgeBaseList();
      for (const [, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        expect(list).toContain(entry.label);
      }
    });

    it('should include cite URL only when larkUrl is non-empty', () => {
      const list = buildKnowledgeBaseList();
      const lines = list.split('\n');

      for (const [, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        if (entry.larkUrl) {
          expect(list).toContain(`cite: ${entry.larkUrl}`);
        }
      }

      // cite lines should only contain Lark URLs, never R2 URLs
      for (const line of lines) {
        if (line.trim().startsWith('- cite:')) {
          expect(line).toContain('jemmiadiamond.sg.larksuite.com');
          expect(line).not.toContain('r2.cloudflarestorage.com');
        }
      }
    });

    it('should omit cite line when larkUrl is empty', () => {
      const list = buildKnowledgeBaseList();
      const lines = list.split('\n');

      for (const [filename, entry] of Object.entries(JEMMIA_KNOWLEDGE_FILES)) {
        if (!entry.larkUrl) {
          // Find the label line index
          const labelIdx = lines.findIndex((l: string) => l.includes(entry.label));
          if (labelIdx !== -1) {
            const nextLine = lines[labelIdx + 1] ?? '';
            // Next line should be crawl, not cite
            expect(nextLine.trim()).toMatch(/^- crawl:/);
          }
        }
      }
    });

    it('should use R2 URLs for crawl entries', () => {
      const list = buildKnowledgeBaseList();
      const lines = list.split('\n');

      for (const line of lines) {
        if (line.trim().startsWith('- crawl:')) {
          expect(line).toContain('r2.cloudflarestorage.com');
        }
      }
    });
  });

  describe('getLarkUrlForR2', () => {
    it('should return null for non-R2 URLs', () => {
      expect(getLarkUrlForR2('https://example.com/file.md')).toBeNull();
    });

    it('should return null for R2 URLs with no mapping', () => {
      const url =
        'https://90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com/lobe/knowledges/no-such-file.md';
      expect(getLarkUrlForR2(url)).toBeNull();
    });

    it('should return Lark URL for mapped R2 files', () => {
      // Find a file that has a larkUrl
      const mapped = Object.entries(JEMMIA_KNOWLEDGE_FILES).find(([, e]) => e.larkUrl);
      if (!mapped) return; // skip if no mapped files yet

      const [filename, entry] = mapped;
      const r2Url = `https://90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com/lobe/knowledges/${filename}`;
      expect(getLarkUrlForR2(r2Url)).toBe(entry.larkUrl);
    });

    it('should return null for mapped R2 files with empty larkUrl', () => {
      const unmapped = Object.entries(JEMMIA_KNOWLEDGE_FILES).find(([, e]) => !e.larkUrl);
      if (!unmapped) return;

      const [filename] = unmapped;
      const r2Url = `https://90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com/lobe/knowledges/${filename}`;
      expect(getLarkUrlForR2(r2Url)).toBeNull();
    });
  });
});
