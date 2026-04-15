-- Upgrade embedding vector dimensions from 1024 to 3072
-- gemini-embedding-2-preview native dimension is 3072
-- pgvector 0.8+ supports halfvec HNSW index up to 4000 dims

-- 1. Drop existing HNSW index
DROP INDEX IF EXISTS "embeddings_embedding_idx";

-- 2. Delete all existing 1024-dim embeddings
DELETE FROM "embeddings";

-- 3. Drop old column and add new one at 3072 dims
ALTER TABLE "embeddings" DROP COLUMN IF EXISTS "embeddings";
ALTER TABLE "embeddings" ADD COLUMN "embeddings" vector(3072);

-- 4. Create HNSW index using halfvec cast (supports up to 4000 dims in pgvector 0.7+)
CREATE INDEX IF NOT EXISTS "embeddings_embedding_idx"
ON "embeddings"
USING hnsw ((embeddings::halfvec(3072)) halfvec_cosine_ops);
