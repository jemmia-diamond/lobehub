export interface FileSearchResultChunk {
  similarity: number;
  text: string;
}

export interface FileSearchResult {
  fileId: string;
  fileName: string;
  relevanceScore: number;
  topChunks: FileSearchResultChunk[];
}

/**
 * Formats a single chunk with XML tags
 */
const formatChunk = (chunk: FileSearchResultChunk, fileId: string, fileName: string): string => {
  return `<chunk fileId="${fileId}" fileName="${fileName}" similarity="${chunk.similarity}">${chunk.text}</chunk>`;
};

/**
 * Formats a single file search result with XML tags
 */
const formatFile = (file: FileSearchResult): string => {
  const chunks = file.topChunks.map((chunk) => formatChunk(chunk, file.fileId, file.fileName));

  return `<file id="${file.fileId}" name="${file.fileName}" relevanceScore="${file.relevanceScore}">
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
- **No R2 Citations**: Do NOT cite R2 storage URLs (r2.cloudflarestorage.com) in your response. This data comes from the internal knowledge base — no external URL citation is needed.</instruction>
${filesXml}
</knowledge_base_search_results>`;
};
