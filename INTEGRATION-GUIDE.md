# Synth ↔ n8n Integration Guide

## Overview

This document explains how Synth's integration layer bridges your Next.js frontend with n8n's automation engine, enabling AI-powered workflow creation and execution.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │         │              │         │             │
│   Synth     │────────▶│   Supabase   │◀────────│    n8n      │
│  (Next.js)  │         │  (Database)  │         │ (Automation)│
│             │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
      │                       │                         │
      │                       │                         │
      ▼                       ▼                         ▼
  Chat UI              workflows table           REST API
  API Routes           executions table          Workflow Engine
  n8n Client           users table               Manual/Auto Triggers
```

### Data Flow

1. **User Intent** → Synth Chat UI
2. **Workflow Blueprint** → Supabase `workflows` table
3. **n8n Workflow Creation** → n8n REST API
4. **n8n Workflow ID** → Back to Supabase
5. **Execution Trigger** → n8n executes workflow
6. **Execution Results** → Synced back to Supabase `executions` table

## Components

### 1. n8n Client Library (`lib/n8nClient.ts`)

Central utility for all n8n interactions. Provides:

- **`createWorkflow(blueprint)`** - Create workflows in n8n
- **`getWorkflow(id)`** - Fetch workflow details
- **`setWorkflowActive(id, active)`** - Activate/deactivate workflows
- **`executeWorkflow(id, input)`** - Trigger workflow execution
- **`getExecutions(params)`** - Fetch execution history
- **`blueprintToN8nWorkflow(blueprint)`** - Convert Synth format to n8n format

**Key Features:**
- Automatic authentication using `N8N_API_KEY`
- Blueprint to n8n workflow transformation
- Type-safe interfaces for all API operations

### 2. API Routes

#### **POST `/api/workflows/create`**

Creates a new workflow in both Synth and n8n.

**Request Body:**
```json
{
  "name": "Send Daily Report",
  "intent": "Send me a daily summary email",
  "description": "Optional description",
  "trigger": {
    "type": "schedule",
    "config": { "cron": "0 9 * * *" }
  },
  "actions": [
    {
      "type": "email",
      "config": {
        "name": "Send Email",
        "to": "user@example.com",
        "subject": "Daily Report"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow created successfully",
  "workflow": {
    "id": "uuid-1234",
    "name": "Send Daily Report",
    "intent": "Send me a daily summary email",
    "n8n_workflow_id": "5",
    "active": false,
    "created_at": "2025-11-06T..."
  }
}
```

**Flow:**
1. Validate required fields (`name`, `intent`)
2. Insert into Supabase `workflows` table
3. Convert blueprint to n8n format
4. POST to n8n API `/api/v1/workflows`
5. Update Supabase with `n8n_workflow_id`
6. Return combined result

---

#### **POST `/api/workflows/trigger`**

Executes an existing workflow on demand.

**Request Body:**
```json
{
  "workflow_id": "uuid-1234",
  "input": {
    "customData": "value",
    "parameters": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Workflow triggered successfully",
  "execution": {
    "id": "uuid-5678",
    "workflow_id": "uuid-1234",
    "workflow_name": "Send Daily Report",
    "n8n_execution_id": "42",
    "status": "running",
    "started_at": "2025-11-06T..."
  }
}
```

**Flow:**
1. Fetch workflow from Supabase by `workflow_id`
2. Validate workflow has `n8n_workflow_id`
3. POST to n8n `/api/v1/workflows/{id}/execute`
4. Save execution record to Supabase `executions` table
5. Return execution details

---

#### **GET `/api/executions/sync`**

Syncs recent execution data from n8n to Supabase.

**Query Parameters:**
- `workflow_id` (optional) - Filter by specific Synth workflow
- `limit` (optional, default: 50) - Max executions to fetch

**Response:**
```json
{
  "success": true,
  "message": "Executions synced successfully",
  "summary": {
    "total": 25,
    "inserted": 10,
    "updated": 12,
    "skipped": 3,
    "errors": []
  }
}
```

**Flow:**
1. Optionally convert Synth `workflow_id` to `n8n_workflow_id`
2. GET from n8n `/api/v1/executions`
3. For each execution:
   - Check if exists in Supabase (by `n8n_execution_id`)
   - Insert new or update existing record
4. Return sync summary

---

## Database Schema

### Required Columns

The integration routes use these Supabase tables:

**`workflows` table:**
```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  intent TEXT NOT NULL,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT false,
  n8n_workflow_id TEXT,  -- Links to n8n
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**`executions` table:**
```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  n8n_execution_id TEXT UNIQUE,  -- Links to n8n
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration Script

Run this SQL in your Supabase SQL Editor to add the n8n integration columns:

```sql
-- File: scripts/add-execution-columns.sql
ALTER TABLE executions
ADD COLUMN IF NOT EXISTS n8n_execution_id TEXT UNIQUE;

ALTER TABLE executions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE executions
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_executions_n8n_execution_id
ON executions(n8n_execution_id);
```

---

## Setup Instructions

### 1. Prerequisites

- ✅ n8n running on `http://localhost:5678`
- ✅ n8n API key configured in `.env.local`
- ✅ Supabase project with required tables
- ✅ Next.js development server

### 2. Environment Variables

Ensure these are in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
```

### 3. Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Run `scripts/add-execution-columns.sql`
3. Verify columns exist: `SELECT * FROM executions LIMIT 1;`

### 4. Start Services

```bash
# Terminal 1: Start n8n
.\start-n8n.ps1

# Terminal 2: Start Next.js
npm run dev
```

### 5. Test Integration

```bash
# Run integration tests
node test-synth-n8n-integration.js

# Or test n8n connection separately
node test-n8n-api.js
```

---

## Usage Examples

### Example 1: Create Workflow from Chat

```typescript
// In your chat route or component
const response = await fetch('/api/workflows/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Notify me on GitHub stars",
    intent: "Get notified when my repo gets a new star",
    trigger: {
      type: "webhook",
      config: {
        path: "github-webhook",
        method: "POST"
      }
    },
    actions: [
      {
        type: "slack",
        config: {
          name: "Send to Slack",
          channel: "#notifications",
          message: "New GitHub star! 🌟"
        }
      }
    ]
  })
});

const data = await response.json();
console.log('Workflow created:', data.workflow.id);
```

### Example 2: Trigger Workflow

```typescript
// Trigger a workflow manually
const response = await fetch('/api/workflows/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflow_id: 'uuid-from-create',
    input: {
      customMessage: 'Hello from Synth!',
      priority: 'high'
    }
  })
});

const data = await response.json();
console.log('Execution started:', data.execution.status);
```

### Example 3: Sync Executions

```typescript
// Sync all recent executions
const response = await fetch('/api/executions/sync?limit=20');
const data = await response.json();

console.log(`Synced ${data.summary.total} executions`);
console.log(`New: ${data.summary.inserted}, Updated: ${data.summary.updated}`);
```

---

## Trigger Type Mapping

Synth uses simplified trigger types that map to n8n nodes:

| Synth Type | n8n Node Type | Use Case |
|------------|---------------|----------|
| `manual` | `n8n-nodes-base.manualTrigger` | On-demand execution |
| `webhook` | `n8n-nodes-base.webhook` | HTTP webhooks |
| `schedule` | `n8n-nodes-base.scheduleTrigger` | Cron jobs |
| `email` | `n8n-nodes-base.emailTrigger` | Email triggers |

## Action Type Mapping

| Synth Type | n8n Node Type | Use Case |
|------------|---------------|----------|
| `http` | `n8n-nodes-base.httpRequest` | API calls |
| `email` | `n8n-nodes-base.emailSend` | Send emails |
| `slack` | `n8n-nodes-base.slack` | Slack messages |
| `code` | `n8n-nodes-base.code` | Custom JavaScript |
| `set` | `n8n-nodes-base.set` | Set variables |

---

## Error Handling

All routes follow this error handling pattern:

1. **400 Bad Request** - Missing or invalid parameters
2. **404 Not Found** - Workflow/execution doesn't exist
3. **207 Multi-Status** - Partial success (e.g., saved to Supabase but n8n failed)
4. **500 Internal Server Error** - Unexpected errors

Example error response:
```json
{
  "error": "Failed to create workflow in n8n",
  "details": "n8n API error (401): Invalid API key"
}
```

---

## Troubleshooting

### Issue: "N8N_API_KEY is not configured"
**Solution:** Add `N8N_API_KEY` to `.env.local` and restart Next.js server

### Issue: "Workflow not found or not linked to n8n"
**Solution:** Check that `n8n_workflow_id` is not null in the workflows table

### Issue: "Failed to save execution to Supabase"
**Solution:** Run the migration script to add missing columns

### Issue: Executions sync returns 0 total
**Solution:** Check that:
1. n8n is running and accessible
2. Workflows have been executed at least once
3. `N8N_API_KEY` has permission to read executions

---

## Next Steps

1. **Integrate with Chat UI**: Call `/api/workflows/create` when user requests a workflow
2. **Add Workflow List Page**: Fetch and display workflows from Supabase
3. **Add Execution Dashboard**: Show recent executions with status
4. **Add Workflow Activation**: Allow users to activate/deactivate workflows
5. **Add Error Notifications**: Alert users when executions fail

---

## Architecture Benefits

✅ **Separation of Concerns** - Synth handles UI/UX, n8n handles automation
✅ **Data Persistence** - All workflow metadata stored in Supabase
✅ **Traceability** - Full execution history synced and queryable
✅ **Flexibility** - Can swap n8n for another engine without changing frontend
✅ **Type Safety** - TypeScript interfaces for all API interactions

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/n8nClient.ts` | Shared n8n API utilities |
| `app/api/workflows/create/route.ts` | Workflow creation endpoint |
| `app/api/workflows/trigger/route.ts` | Workflow execution endpoint |
| `app/api/executions/sync/route.ts` | Execution sync endpoint |
| `scripts/add-execution-columns.sql` | Database migration |
| `test-synth-n8n-integration.js` | Integration test suite |
| `INTEGRATION-GUIDE.md` | This documentation |

---

## Questions?

- n8n API Docs: https://docs.n8n.io/api/
- Supabase Docs: https://supabase.com/docs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
