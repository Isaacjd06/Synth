-- Migration: Add n8n integration columns to executions table
-- This adds columns needed for syncing executions between Synth and n8n
--
-- Run this in your Supabase SQL Editor

-- Add n8n_execution_id column (nullable, unique)
-- Note: n8n uses integer IDs for executions
ALTER TABLE executions
ADD COLUMN IF NOT EXISTS n8n_execution_id INTEGER UNIQUE;

-- Add started_at column
ALTER TABLE executions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add finished_at column (nullable)
ALTER TABLE executions
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- Create index for faster lookups by n8n_execution_id
CREATE INDEX IF NOT EXISTS idx_executions_n8n_execution_id
ON executions(n8n_execution_id);

-- Create index for faster lookups by workflow_id and status
CREATE INDEX IF NOT EXISTS idx_executions_workflow_status
ON executions(workflow_id, status);

-- Add comment describing the columns
COMMENT ON COLUMN executions.n8n_execution_id IS 'Unique ID from n8n for this execution';
COMMENT ON COLUMN executions.started_at IS 'When the execution started in n8n';
COMMENT ON COLUMN executions.finished_at IS 'When the execution finished in n8n (null if still running)';
