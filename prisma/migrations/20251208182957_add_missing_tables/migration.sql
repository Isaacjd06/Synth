-- CreateTable
CREATE TABLE IF NOT EXISTS "advisory_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT DEFAULT 'medium',
    "category" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advisory_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "business_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "glossary" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "knowledge_files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" TEXT,
    "processed_content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "structured_knowledge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "structured_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "purchase_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "amount" INTEGER,
    "currency" TEXT DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'succeeded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "stripe_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subscription_cancel_reasons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_cancel_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "webhook_event_logs" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "workflow_learned_patterns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "pattern_name" TEXT NOT NULL,
    "pattern_description" TEXT,
    "extracted_data" JSONB NOT NULL,
    "source_workflow_id" TEXT,
    "source_workflow_name" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "workflow_learned_patterns_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add missing columns to Execution table
ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "error_message" TEXT;
ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "execution_time_ms" INTEGER;
ALTER TABLE "Execution" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3);

-- AlterTable: Add missing columns to workflows table
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "last_deployed_at" TIMESTAMP(3);
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "pipedream_deployment_state" TEXT;
ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "created_by_ai" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add missing columns to Knowledge table
ALTER TABLE "Knowledge" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "Knowledge" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Add missing columns to connections table
ALTER TABLE "connections" ADD COLUMN IF NOT EXISTS "pipedream_auth_id" TEXT;
ALTER TABLE "connections" ADD COLUMN IF NOT EXISTS "pipedream_source_id" TEXT;

-- AlterTable: Add missing columns to chat_messages table
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- AlterTable: Add missing columns to waitlist table
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'landing_page';
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'waiting';
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "advisory_insights_source_type_created_at_idx" ON "advisory_insights"("source_type", "created_at");
CREATE INDEX IF NOT EXISTS "advisory_insights_user_id_created_at_idx" ON "advisory_insights"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "api_keys_key_prefix_idx" ON "api_keys"("key_prefix");
CREATE INDEX IF NOT EXISTS "api_keys_user_id_idx" ON "api_keys"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "business_rules_user_id_created_at_idx" ON "business_rules"("user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "glossary_user_id_term_key" ON "glossary"("user_id", "term");
CREATE INDEX IF NOT EXISTS "glossary_user_id_idx" ON "glossary"("user_id");
CREATE INDEX IF NOT EXISTS "glossary_term_idx" ON "glossary"("term");
CREATE INDEX IF NOT EXISTS "knowledge_files_user_id_created_at_idx" ON "knowledge_files"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "knowledge_files_status_idx" ON "knowledge_files"("status");
CREATE INDEX IF NOT EXISTS "structured_knowledge_user_id_type_idx" ON "structured_knowledge"("user_id", "type");
CREATE INDEX IF NOT EXISTS "structured_knowledge_user_id_created_at_idx" ON "structured_knowledge"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "purchase_logs_addon_id_idx" ON "purchase_logs"("addon_id");
CREATE INDEX IF NOT EXISTS "purchase_logs_user_id_created_at_idx" ON "purchase_logs"("user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_events_stripe_event_id_key" ON "stripe_events"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "subscription_cancel_reasons_user_id_created_at_idx" ON "subscription_cancel_reasons"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "usage_logs_event_created_at_idx" ON "usage_logs"("event", "created_at");
CREATE INDEX IF NOT EXISTS "usage_logs_user_id_created_at_idx" ON "usage_logs"("user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_event_logs_stripe_event_id_key" ON "webhook_event_logs"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_event_type_processed_idx" ON "webhook_event_logs"("event_type", "processed");
CREATE INDEX IF NOT EXISTS "webhook_event_logs_stripe_event_id_idx" ON "webhook_event_logs"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "workflow_learned_patterns_user_id_pattern_type_idx" ON "workflow_learned_patterns"("user_id", "pattern_type");
CREATE INDEX IF NOT EXISTS "workflow_learned_patterns_pattern_type_usage_count_idx" ON "workflow_learned_patterns"("pattern_type", "usage_count");
CREATE INDEX IF NOT EXISTS "workflow_learned_patterns_source_workflow_id_idx" ON "workflow_learned_patterns"("source_workflow_id");
CREATE INDEX IF NOT EXISTS "Execution_status_created_at_idx" ON "Execution"("status", "created_at");
CREATE INDEX IF NOT EXISTS "Execution_user_id_created_at_idx" ON "Execution"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "Execution_workflow_id_created_at_idx" ON "Execution"("workflow_id", "created_at");
CREATE INDEX IF NOT EXISTS "workflows_user_id_active_idx" ON "workflows"("user_id", "active");
CREATE INDEX IF NOT EXISTS "workflows_created_by_ai_idx" ON "workflows"("created_by_ai");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'advisory_insights_user_id_fkey'
    ) THEN
        ALTER TABLE "advisory_insights" ADD CONSTRAINT "advisory_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_user_id_fkey'
    ) THEN
        ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'business_rules_user_id_fkey'
    ) THEN
        ALTER TABLE "business_rules" ADD CONSTRAINT "business_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'glossary_user_id_fkey'
    ) THEN
        ALTER TABLE "glossary" ADD CONSTRAINT "glossary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_files_user_id_fkey'
    ) THEN
        ALTER TABLE "knowledge_files" ADD CONSTRAINT "knowledge_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'structured_knowledge_user_id_fkey'
    ) THEN
        ALTER TABLE "structured_knowledge" ADD CONSTRAINT "structured_knowledge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'purchase_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "purchase_logs" ADD CONSTRAINT "purchase_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscription_cancel_reasons_user_id_fkey'
    ) THEN
        ALTER TABLE "subscription_cancel_reasons" ADD CONSTRAINT "subscription_cancel_reasons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usage_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_learned_patterns_user_id_fkey'
    ) THEN
        ALTER TABLE "workflow_learned_patterns" ADD CONSTRAINT "workflow_learned_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workflow_learned_patterns_source_workflow_id_fkey'
    ) THEN
        ALTER TABLE "workflow_learned_patterns" ADD CONSTRAINT "workflow_learned_patterns_source_workflow_id_fkey" FOREIGN KEY ("source_workflow_id") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

