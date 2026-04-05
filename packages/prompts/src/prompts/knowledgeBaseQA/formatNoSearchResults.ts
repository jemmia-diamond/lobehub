/**
 * Format prompt when no search results found using XML structure
 */
export const promptNoSearchResults = (query: string): string => {
  return `<knowledge_base_search_results query="${query}" totalCount="0">
<instruction>No relevant internal documents found in the Jemmia knowledge base.
Inform your colleague that internal data is unavailable, and auto-fallback to using web search or other available tools to assist with their research or tasks.</instruction>
<suggestions>
<suggestion>State professionally that the specific data is missing from the internal knowledge base.</suggestion>
<suggestion>Utilize web search immediately to find external market data to help your colleague anyway.</suggestion>
</suggestions>
</knowledge_base_search_results>`;
};
