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
const formatChunk = (chunk: FileSearchResultChunk, fileId: string, fileName: string): string => {
  return `<chunk fileName="${fileName}" similarity="${chunk.similarity}">${chunk.text}</chunk>`;
};

const R2_BASE = '90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com/lobe/knowledges/';

const getCitationUrl = (
  fileName: string,
  fileUrl?: string | null,
  larkUrlMap?: Record<string, string>,
): string | null => {
  if (!fileUrl?.startsWith('local://jemmia-diamond/')) return null;
  const name = fileUrl.replace('local://jemmia-diamond/', '');
  return (larkUrlMap?.[name] || undefined) ?? `https://${R2_BASE}${encodeURIComponent(name)}`;
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
- **Citation with Links**: When citing a source file, use a markdown footnote: \`[^1]\` in the text and \`[^1]: [filename](citationUrl)\` at the bottom — where \`citationUrl\` is the value of the \`citationUrl\` XML attribute on the \`<file>\` tag. NEVER use the \`id\` attribute as a URL. Only cite files you actually used.</instruction>
${filesXml}
</knowledge_base_search_results>`;
};
