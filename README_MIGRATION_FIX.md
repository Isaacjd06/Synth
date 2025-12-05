# Fix Chat Messages Table Error

## Problem
The error `The table 'public.chat_messages' does not exist` occurs because:
- Initial migration created table as `"ChatMessage"` (capital C, capital M)
- Schema expects `"chat_messages"` (lowercase, underscore) via `@@map("chat_messages")`

## Solution Options

### Option 1: Apply Prisma Migration (Recommended)
Run this command in your terminal:

```bash
npx prisma migrate deploy
```

Or if you're in development:

```bash
npx prisma migrate dev
```

This will apply the migration file: `prisma/migrations/20250105000000_fix_chat_messages_table_name/migration.sql`

### Option 2: Run SQL Directly (If migrations fail)
If Prisma migrations aren't working, you can run the SQL directly in your database:

1. Connect to your Neon database (via Neon Console SQL Editor or psql)
2. Run the SQL from: `scripts/fix-chat-table.sql`

Or copy-paste this SQL:

```sql
-- Quick fix: Create/rename chat_messages table
DO $$
BEGIN
    -- If "ChatMessage" exists, rename it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ChatMessage') THEN
        ALTER TABLE "ChatMessage" RENAME TO "chat_messages";
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'message') THEN
            ALTER TABLE "chat_messages" RENAME COLUMN "message" TO "content";
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'conversation_id') THEN
            ALTER TABLE "chat_messages" ADD COLUMN "conversation_id" TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'metadata') THEN
            ALTER TABLE "chat_messages" ADD COLUMN "metadata" JSONB;
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'session_id') THEN
            ALTER TABLE "chat_messages" DROP COLUMN "session_id";
        END IF;
    END IF;
    
    -- If table doesn't exist, create it
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
        
        ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        CREATE INDEX IF NOT EXISTS "idx_chat_messages_conversation_id" ON "chat_messages"("conversation_id");
    END IF;
END $$;
```

### Option 3: Reset and Re-migrate (Last Resort)
⚠️ **WARNING: This will delete all data**

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Apply all migrations from scratch

## Verification

After applying the fix, verify the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages';
```

You should see `chat_messages` in the results.

## Next Steps

After the table is created/renamed:
1. Restart your Next.js dev server
2. Try loading the chat page again
3. The error should be resolved

