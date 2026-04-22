import { describe, expect, it } from 'vitest';

import type { FileSearchResult } from './formatSearchResults';
import { formatSearchResults } from './formatSearchResults';

const makeFile = (overrides: Partial<FileSearchResult> = {}): FileSearchResult => ({
  fileId: 'file-1',
  fileName: 'Policy.md',
  fileUrl: 'local://jemmia-diamond/policy.md',
  relevanceScore: 0.85,
  topChunks: [{ similarity: 0.9, text: 'Company policy states...' }],
  ...overrides,
});

describe('formatSearchResults — citation behavior', () => {
  describe('citationUrl attribute', () => {
    it('should include citationUrl when larkUrl mapping exists', () => {
      const result = formatSearchResults(
        [makeFile()],
        'company policy',
        { 'policy.md': 'https://jemmiadiamond.sg.larksuite.com/wiki/abc123' },
      );

      expect(result).toContain('citationUrl="https://jemmiadiamond.sg.larksuite.com/wiki/abc123"');
    });

    it('should NOT include citationUrl when larkUrl mapping is missing', () => {
      const result = formatSearchResults([makeFile()], 'company policy', {});

      expect(result).not.toContain('citationUrl=');
    });

    it('should NOT include citationUrl when fileUrl is not a local jemmia URL', () => {
      const result = formatSearchResults(
        [makeFile({ fileUrl: 'https://external.com/file.md' })],
        'query',
        { 'policy.md': 'https://jemmiadiamond.sg.larksuite.com/wiki/abc123' },
      );

      expect(result).not.toContain('citationUrl=');
    });

    it('should NOT include citationUrl when fileUrl is null', () => {
      const result = formatSearchResults(
        [makeFile({ fileUrl: null })],
        'query',
        { 'policy.md': 'https://jemmiadiamond.sg.larksuite.com/wiki/abc123' },
      );

      expect(result).not.toContain('citationUrl=');
    });
  });

  describe('instruction format — structured bullet spec', () => {
    it('should use structured Grounding Rules header', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('**Grounding Rules:**');
    });

    it('should use structured Citation Rules header', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('**Citation Rules:**');
    });

    it('should use mathematical threshold >0.5 for grounding', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('(>0.5)');
      expect(result).toContain('(<0.5)');
    });

    it('should instruct to answer WITHOUT footnote when no citationUrl', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('NO `citationUrl` attribute → answer WITHOUT footnote');
    });

    it('should prohibit R2 URLs in citations', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('NEVER use R2 URLs');
      expect(result).toContain('r2.cloudflarestorage.com');
    });

    it('should prohibit placeholder values as URLs', () => {
      const result = formatSearchResults([makeFile()], 'query', {});
      expect(result).toContain('NEVER use `fileDbId`, `None`, `null`, or placeholders as URLs');
    });
  });

  describe('empty results', () => {
    it('should instruct to use lobe-web-browsing when no results', () => {
      const result = formatSearchResults([], 'query', {});
      expect(result).toContain('totalCount="0"');
      expect(result).toContain('lobe-web-browsing');
      expect(result).toContain('R2 source files');
    });
  });
});
