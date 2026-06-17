# Retrieval-Augmented Generation (RAG) & Knowledge Base

This document outlines the pipeline used by Brainy to bootstrap local knowledge files, process document embeddings, handle API rate limits, and resolve source citations.

---

## 1. Automated Knowledge Bootstrapping

Brainy synchronizes static documentation files placed in `packages/knowledge-seed/jemmia-diamond/` (supporting `.md`, `.pdf`, and `.docx` extensions) into the database on server startup. This routine is triggered by `KnowledgeBootstrapService.bootstrapOnce()` under the default administrator account (`user_jemmora_admin`):

- **New Indexing**: Any new file found in the directory is parsed, chunked, and embedded into the database.
- **Updates**: If a file's contents change (detected by comparing its SHA-256 hash with the database record), the system deletes the old document records, chunks, and vector embeddings, and then re-indexes the document.
- **Optimized Renaming**: If a file's hash matches a database record but the filename or URL (`local://jemmia-diamond/filename.md`) changes, the system performs an **in-place update** of the metadata without recalculating embeddings, saving API costs.
- **Deletions**: Files removed from the directory are detected and wiped from the database.

---

## 2. RAG & Embedding Pipeline (`RagService`)

Document chunking and vector calculations are managed by `RagService` (`src/server/services/rag/index.ts`):

1. **Chunking**: Documents are split into text segments using the `ContentChunk` module.
2. **Embedding**:
   - Chunks are embedded using Google's `gemini-embedding-2-preview` model.
   - Embeddings are requested at exactly **3072 dimensions** (using the `outputDimensionality` parameter).
   - Vectors are stored in the `embeddings` column of the `embeddings` table (defined as type `vector(3072)`).
   - The database uses an HNSW index cast to a half-vector for cosine similarity search: `USING hnsw ((embeddings::halfvec(3072)) halfvec_cosine_ops)`.
3. **Batching & Throttle Control**:
   - To prevent API rate-limit errors, chunk embeddings are sent in batches of **5 chunks** with a **500ms delay** sleep interval between batches.
   - If a `429 Rate Limit` or quota error is encountered, `embedWithBackoff` executes an exponential backoff retry policy (up to 5 attempts: 10s, 20s, 40s, 80s, 160s). Authentication errors (401/403) abort execution immediately.

---

## 3. Google API Key Rotation & Fallbacks

The wrapper `withGoogleEmbeddingKeyFallback` rotates through a list of Google API keys defined in the `GOOGLE_EMBEDDING_API_KEYS` environment variable (comma-separated list):

- The system uses the keys sequentially.
- If a key encounters an authentication error (401 or 403), it is marked invalid, and the system switches to the next key immediately without retrying.
- If a key encounters a 429 quota error, the system retries up to 3 times on that key. The retry delay is determined by parsing the Google RPC `RetryInfo` detail block or using the regex `retry in ([\d.]+)s` (defaulting to 5s) before fallback triggers.
- Intermediate failures are logged as `console.warn` to avoid triggering false alarms. A `console.error` is logged (which triggers a Sentry alert) only when **all** configured keys are exhausted.

---

## 4. Citation Resolution & R2-to-Lark Link Mapping

To protect internal Cloudflare R2 bucket URLs and database IDs from being exposed to end-users, Brainy maps internal resource keys to public Lark Wiki documentation links:

- **Single Source of Truth**: The file `src/config/r2ToLarkMapping.ts` contains the `JEMMIA_KNOWLEDGE_FILES` catalog mapping internal R2 storage keys (`local://jemmia-diamond/...`) to display labels and Lark Wiki URLs (`larkUrl`).
- **Knowledge Base Citations**: When the RAG search retrieves a document, `formatSearchResults.ts` checks `R2_TO_LARK_MAP` for a match.
  - If a `larkUrl` is found, the system attaches the `citationUrl` parameter to the `<file>` reference tags. The LLM is instructed to output citations as footnotes: `[^1]: [Document Label](larkUrl)`.
  - If the file is not mapped or has an empty Lark URL, the `citationUrl` parameter is omitted, and the LLM answers the query **without rendering footnotes** for that document.
- **Web Search Fallbacks**: When the web browsing tool (`lobe-web-browsing`) crawls static files hosted in the R2 bucket, `buildKnowledgeBaseList()` builds the knowledge catalog and strips out the `cite:` metadata parameter for files that do not have a configured Lark Wiki URL.
- **Emergency Redirects**: The helper `getLarkUrlForR2(url)` acts as an emergency redirect function. If an R2 link somehow leaks to the client interface, clicking the link redirects the user's browser to the corresponding Lark Wiki URL.
