DROP INDEX IF EXISTS "embeddings_embedding_idx";
--> statement-breakpoint
DELETE FROM "embeddings";
--> statement-breakpoint
ALTER TABLE "embeddings" DROP COLUMN IF EXISTS "embeddings";
--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "embeddings" vector(3072);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_embedding_idx"
  ON "embeddings"
  USING hnsw ((embeddings::halfvec(3072)) halfvec_cosine_ops);
