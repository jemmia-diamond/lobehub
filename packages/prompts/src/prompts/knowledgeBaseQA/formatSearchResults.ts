export interface FileSearchResultChunk {
  similarity: number;
  text: string;
}

export interface FileSearchResult {
  fileId: string;
  fileName: string;
  fileUrl?: string | null;
  relevanceScore: number;
  topChunks: FileSearchResultChunk[];
}

/**
 * Formats a single chunk with XML tags
 */
const formatChunk = (chunk: FileSearchResultChunk, _fileId: string, fileName: string): string => {
  return `<chunk fileName="${fileName}" similarity="${chunk.similarity}">${chunk.text}</chunk>`;
};

const getCitationUrl = (
  fileName: string,
  fileUrl?: string | null,
  larkUrlMap?: Record<string, string>,
): string | null => {
  if (!fileUrl?.startsWith('local://jemmia-diamond/')) return null;
  const name = fileUrl.replace('local://jemmia-diamond/', '');
  const larkUrl = larkUrlMap?.[name];
  return larkUrl || null;
};

/**
 * Formats a single file search result with XML tags
 */
const formatFile = (file: FileSearchResult, larkUrlMap?: Record<string, string>): string => {
  const chunks = file.topChunks.map((chunk) => formatChunk(chunk, file.fileId, file.fileName));
  const citationUrl = getCitationUrl(file.fileName, file.fileUrl, larkUrlMap);
  const urlAttr = citationUrl ? ` citationUrl="${citationUrl}"` : '';

  return `<file fileDbId="${file.fileId}" name="${file.fileName}"${urlAttr} relevanceScore="${file.relevanceScore}">
${chunks.join('\n')}
</file>`;
};

/**
 * Formats knowledge base search results into an XML structure
 * @param fileResults - Array of file search results with relevance scores and chunks
 * @param query - The original search query
 * @param larkUrlMap - Optional filename→larkUrl map for direct Lark citation URLs
 * @returns Formatted XML string with search results
 */
export const formatSearchResults = (
  fileResults: FileSearchResult[],
  query: string,
  larkUrlMap?: Record<string, string>,
): string => {
  if (fileResults.length === 0) {
    return `<knowledge_base_search_results query="${query}" totalCount="0">
<instruction>No relevant chunks found via semantic search (possibly due to embedding failure or no match). Do NOT answer from training data. Instead, immediately use the **lobe-web-browsing** tool to crawl the relevant Jemmia Diamond R2 source files directly — the URLs are listed in the web browsing tool's knowledge base section. Only fall back to general web search if the R2 files do not contain the answer.</instruction>
</knowledge_base_search_results>`;
  }

  const filesXml = fileResults.map((file) => formatFile(file, larkUrlMap)).join('\n');

  return `<knowledge_base_search_results query="${query}" totalCount="${fileResults.length}">
<instruction>Here are the search results from the knowledge base.
- **Strict Grounding**: If the relevance scores are high, prioritize this data.
- **Thinking Partner Logic**: If scores are very low (below 0.5) or info is missing, **Automatically** pivot to using the **Search the Web** (lobe-web-browsing) tool or your general knowledge. Scores above 0.5 are sufficient — do NOT call web browsing when KB results are available.
- **Zero-Apology Policy**: NEVER inform the user that you found no results or that internal data was insufficient.
- **Proactive Transparency**: Never report a failure to find internal info. Pivot silently to the next tool.
- **Always Deliver**: You must ALWAYS provide a high-quality final answer.
- **Citation with Links**:
  - Check each \`<file>\` element for a \`citationUrl\` attribute.
  - ONLY add a footnote if \`citationUrl\` exists with a valid URL (e.g. \`https://jemmiadiamond.sg.larksuite.com/wiki/...\`).
  - Format: \`[^1]\` inline → \`[^1]: [filename](citationUrl)\` at bottom.
  - If NO \`citationUrl\` attribute → answer WITHOUT any footnote.
  - NEVER use R2 storage URLs (\`r2.cloudflarestorage.com\`) in citations.
  - NEVER use \`fileDbId\`, \`None\`, \`null\`, or any placeholder as a URL.
  - Only cite files you actually used in your answer.</instruction>
${filesXml}
</knowledge_base_search_results>`;
};
