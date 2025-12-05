-- Quick fix script to create/rename chat_messages table
-- Run this directly in your database if migrations aren't working

-- Check if "ChatMessage" table exists and rename it to "chat_messages"
DO $$
BEGIN
    -- If "ChatMessage" exists, rename it to "chat_messages"
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ChatMessage') THEN
        ALTER TABLE "ChatMessage" RENAME TO "chat_messages";
        
        -- Rename the message column to content if it exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'message') THEN
            ALTER TABLE "chat_messages" RENAME COLUMN "message" TO "content";
        END IF;
        
        -- Add conversation_id if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'conversation_id') THEN
            ALTER TABLE "chat_messages" ADD COLUMN "conversation_id" TEXT;
        END IF;
        
        -- Add metadata if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'metadata') THEN
            ALTER TABLE "chat_messages" ADD COLUMN "metadata" JSONB;
        END IF;
        
        -- Remove session_id if it exists (no longer in schema)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'session_id') THEN
            ALTER TABLE "chat_messages" DROP COLUMN "session_id";
        END IF;
    END IF;
    
    -- If "chat_messages" doesn't exist at all, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        CREATE TABLE "chat_messages" (
            "id" TEXT NOT NULL,
            "user_id" TEXT NOT NULL,
            "role" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "conversation_id" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "metadata" JSONB,

            CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
        );
        
        -- Add foreign key
        ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        
        -- Create index on conversation_id
        CREATE INDEX IF NOT EXISTS "idx_chat_messages_conversation_id" ON "chat_messages"("conversation_id");
    END IF;
END $$;

