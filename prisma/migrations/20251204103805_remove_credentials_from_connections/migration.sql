-- Migration: Remove credentials field from connections table and add required fields
-- SECURITY: Credentials (OAuth tokens, API keys) must NOT be stored in database
-- They are stored in secure storage system

-- Add new fields
ALTER TABLE "connections" 
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "connection_type" TEXT,
  ADD COLUMN IF NOT EXISTS "last_verified" TIMESTAMP;

-- Remove credentials field (if it exists)
-- Note: This will lose existing credential data, but per architecture, 
-- credentials should not have been stored here in the first place
ALTER TABLE "connections" DROP COLUMN IF EXISTS "credentials";

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS "idx_connections_status" ON "connections"("status");

-- Create index on user_id and service_name for connection lookups
CREATE INDEX IF NOT EXISTS "idx_connections_user_service" ON "connections"("user_id", "service_name");

