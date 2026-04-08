export interface AgenticChunk {
  content: string;
  fileId: string;
  fileName: string;
  id: string; // Sequential ID assigned for the LLM skimmer
  messageIndex?: number; // The index in the history where this chunk originated
  parentId?: string; // Optional original chunk ID for derived subchunk navigation
  rawContent: string; // The exact <chunk> tags for safe replacement
  similarity: string;
  source: string;
}

export interface NavigatedContext {
  modelId: string;
  reasoning: string;
  relevantChunkIds: string[];
}

export interface ModelRoute {
  messages?: any[];
  model: string;
  provider: string;
  reason?: string;
}
