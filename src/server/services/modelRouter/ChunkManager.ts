import type { AgenticChunk } from './types';

export class ChunkManager {
  /**
   * Extracts all RAG chunks from a list of messages.
   * Scans all message roles (system, tool, assistant, etc.) to detect <chunk> patterns.
   */
  public static extractAllChunks(messages: any[]): AgenticChunk[] {
    const allChunks: AgenticChunk[] = [];

    messages.forEach((m, index) => {
      if (typeof m.content === 'string') {
        const messageChunks = this.extractChunks(m.content);
        messageChunks.forEach((c) => {
          allChunks.push({
            ...c,
            id: allChunks.length.toString(), // Global sequential ID for LLM navigation
            messageIndex: index,
          });
        });
      }
    });

    return allChunks;
  }

  /**
   * Internal helper to extract fragments from an XML-formatted string.
   */
  private static extractChunks(content: string): Omit<AgenticChunk, 'id' | 'messageIndex'>[] {
    const chunkRegex =
      /<chunk\s+fileId="([^"]+)"\s+fileName="([^"]+)"\s+similarity="([^"]+)">([\s\S]*?)<\/chunk>/g;
    const chunks = [];
    let match;

    while ((match = chunkRegex.exec(content)) !== null) {
      chunks.push({
        content: match[4],
        fileId: match[1],
        fileName: match[2],
        rawContent: match[0],
        similarity: match[3],
        source: match[2],
      });
    }

    return chunks;
  }

  /**
   * Rebuilds the entire message history by pruning rejected chunks based on the navigator's selection.
   */
  public static rebuildMessages(
    originalMessages: any[],
    allChunks: AgenticChunk[],
    selectedIds: string[],
  ): any[] {
    return originalMessages.map((m, index) => {
      if (typeof m.content !== 'string') return m;

      // Find chunks that belong to this specific message index
      const messageChunks = allChunks.filter((c) => c.messageIndex === index);
      if (messageChunks.length === 0) return m;

      let newContent = m.content;
      messageChunks.forEach((chunk) => {
        // If chunk was NOT selected as relevant, remove it from the textual source
        if (!selectedIds.includes(chunk.id)) {
          newContent = newContent.replace(chunk.rawContent, '');
        }
      });

      return { ...m, content: newContent.trim() };
    });
  }
}
