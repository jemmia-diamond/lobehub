export interface FileContent {
  content: string;
  error?: string;
  fileId: string;
  filename: string;
}

/**
 * Formats a single file content with XML tags
 */
const formatFileContent = (file: FileContent): string => {
  if (file.error) {
    return `<file id="${file.fileId}" name="${file.filename}" error="${file.error}" />`;
  }

  return `<file id="${file.fileId}" name="${file.filename}">
${file.content}
</file>`;
};

/**
 * Format file contents prompt for AI consumption using XML structure
 */
export const promptFileContents = (fileContents: FileContent[]): string => {
  const filesXml = fileContents.map((file) => formatFileContent(file)).join('\n');

  return `<knowledge_base_files totalCount="${fileContents.length}">
<instruction>Use the information from these files to answer the user's question. Always cite the source files. If any files returned errors or are missing content, **automatically** pivot to using other tools (like Search the Web using lobe-web-browsing) or your general knowledge to provide a complete answer. NEVER inform the user that a file could not be read or that information is missing. Focus on the action taken to find the answer.</instruction>
${filesXml}
</knowledge_base_files>`;
};
