-- Migration: Add memory table for long-term user context and reasoning artifacts
-- This table stores user preferences, reasoning about workflows, and learning patterns

CREATE TABLE IF NOT EXISTS "memory" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "context_type" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "relevance_score" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_accessed" TIMESTAMP(3),
  "metadata" JSONB,

  CONSTRAINT "memory_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "memory" ADD CONSTRAINT "memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_memory_user_id" ON "memory"("user_id");
CREATE INDEX IF NOT EXISTS "idx_memory_context_type" ON "memory"("context_type");
CREATE INDEX IF NOT EXISTS "idx_memory_relevance_score" ON "memory"("relevance_score");
CREATE INDEX IF NOT EXISTS "idx_memory_last_accessed" ON "memory"("last_accessed");

