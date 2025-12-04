-- Migration: Update chat_messages table to match architecture documentation
-- Rename "message" to "content", add "conversation_id" and "metadata" fields

-- Rename message column to content
ALTER TABLE "chat_messages" RENAME COLUMN "message" TO "content";

-- Add conversation_id column
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "conversation_id" TEXT;

-- Add metadata column
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Create index on conversation_id for faster queries
CREATE INDEX IF NOT EXISTS "idx_chat_messages_conversation_id" ON "chat_messages"("conversation_id");

-- Note: created_at field is kept as-is (maps to "timestamp" in documentation)

