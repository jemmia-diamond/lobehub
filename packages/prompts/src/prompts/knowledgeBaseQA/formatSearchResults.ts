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
  return `<chunk fileId="${fileId}" fileName="${fileName}" similarity="${chunk.similarity}">${chunk.text}</chunk>`;
};

const R2_BASE = '90814f99c119cd5dc08362580f81a76f.r2.cloudflarestorage.com/lobe/knowledges/';

const getR2Url = (fileName: string, fileUrl?: string | null): string | null => {
  if (fileUrl?.startsWith('local://jemmia-diamond/')) {
    const name = fileUrl.replace('local://jemmia-diamond/', '');
    return `https://${R2_BASE}${encodeURIComponent(name)}`;
  }
  return null;
};

/**
 * Formats a single file search result with XML tags
 */
const formatFile = (file: FileSearchResult): string => {
  const chunks = file.topChunks.map((chunk) => formatChunk(chunk, file.fileId, file.fileName));
  const r2Url = getR2Url(file.fileName, file.fileUrl);
  const urlAttr = r2Url ? ` r2Url="${r2Url}"` : '';

  return `<file id="${file.fileId}" name="${file.fileName}"${urlAttr} relevanceScore="${file.relevanceScore}">
${chunks.join('\n')}
</file>`;
};

/**
 * Formats knowledge base search results into an XML structure
 * @param fileResults - Array of file search results with relevance scores and chunks
 * @param query - The original search query
 * @returns Formatted XML string with search results
 */
export const formatSearchResults = (fileResults: FileSearchResult[], query: string): string => {
  if (fileResults.length === 0) {
    return `<knowledge_base_search_results query="${query}" totalCount="0">
<instruction>No relevant files found in the knowledge base. **Automatically** pivot to using the **Search the Web** (lobe-web-browsing) tool or other tools to complete the user's request. NEVER mention that no files were found or that internal data was unavailable. Focus on the action taken to find the answer.</instruction>
</knowledge_base_search_results>`;
  }

  const filesXml = fileResults.map((file) => formatFile(file)).join('\n');

  return `<knowledge_base_search_results query="${query}" totalCount="${fileResults.length}">
<instruction>Here are the search results from the knowledge base.
- **Strict Grounding**: If the relevance scores are high, prioritize this data.
- **Thinking Partner Logic**: If scores are low (e.g. 0.00) or info is missing, **Automatically** pivot to using the **Search the Web** (lobe-web-browsing) tool or your general knowledge.
- **Zero-Apology Policy**: NEVER inform the user that you found no results or that internal data was insufficient.
- **Proactive Transparency**: Focus on your next action (e.g., "Accessing broader search data...") rather than reporting a failure to find internal info.
- **Always Deliver**: You must ALWAYS provide a high-quality final answer.
- **Citation with Links**: When citing a source file that has an \`r2Url\` attribute, use a markdown footnote: \`[^1]\` in the text and \`[^1]: [filename](r2Url)\` at the bottom. This allows users to click through to the original document. Only cite files you actually used.</instruction>
${filesXml}
</knowledge_base_search_results>`;
};
