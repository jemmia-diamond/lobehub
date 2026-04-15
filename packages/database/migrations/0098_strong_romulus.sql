DROP INDEX IF EXISTS "embeddings_embedding_idx";
DELETE FROM "embeddings";
ALTER TABLE "embeddings" DROP COLUMN IF EXISTS "embeddings";
ALTER TABLE "embeddings" ADD COLUMN "embeddings" vector(3072);
CREATE INDEX IF NOT EXISTS "embeddings_embedding_idx"
  ON "embeddings"
  USING hnsw ((embeddings::halfvec(3072)) halfvec_cosine_ops);
