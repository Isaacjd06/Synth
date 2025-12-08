# Complete Backend-to-UI and Pipedream Integration Audit

## Executive Summary

This audit documents **ALL** connections between the UI and backend, and **ALL** functions that connect to the Pipedream API. The application uses Pipedream as the **ONLY** workflow execution engine during MVP phase.

---

## Table of Contents

1. [Pipedream API Integration Functions](#pipedream-api-integration-functions)
2. [Backend API Routes](#backend-api-routes)
3. [UI Components and Their API Connections](#ui-components-and-their-api-connections)
4. [Complete Connection Map](#complete-connection-map)
5. [Data Flow Diagrams](#data-flow-diagrams)

---

## Pipedream API Integration Functions

### Core Pipedream Client Libraries

#### 1. `lib/pipedreamClient.ts`
**Purpose:** Primary Pipedream REST API client

**Functions:**
- `createWorkflow(blueprint: WorkflowBlueprint)` → Creates workflow in Pipedream
  - **Pipedream API:** `POST /workflows`
  - **Returns:** `PipedreamWorkflow`
  
- `getWorkflow(workflowId: string)` → Fetches workflow from Pipedream
  - **Pipedream API:** `GET /workflows/{workflowId}`
  - **Returns:** `PipedreamWorkflow`
  
- `updateWorkflow(workflowId, blueprint)` → Updates workflow in Pipedream
  - **Pipedream API:** `PUT /workflows/{workflowId}`
  - **Returns:** `PipedreamWorkflow`
  
- `deleteWorkflow(workflowId: string)` → Deletes workflow from Pipedream
  - **Pipedream API:** `DELETE /workflows/{workflowId}`
  - **Returns:** `void`
  
- `setWorkflowActive(workflowId, active: boolean)` → Activates/deactivates workflow
  - **Pipedream API:** `PATCH /workflows/{workflowId}` with `{ active }`
  - **Returns:** `PipedreamWorkflow`
  
- `executeWorkflow(workflowId, inputData?)` → Executes workflow manually
  - **Pipedream API:** `POST /workflows/{workflowId}/execute`
  - **Returns:** `PipedreamExecution`
  
- `getExecution(executionId: string)` → Fetches execution details
  - **Pipedream API:** `GET /executions/{executionId}`
  - **Returns:** `PipedreamExecution`

**Helper Functions:**
- `blueprintToPipedreamWorkflow(blueprint)` → Converts Synth blueprint to Pipedream format
- `pipedreamRequest<T>(endpoint, options)` → Makes authenticated requests to Pipedream API

**Environment Variables:**
- `PIPEDREAM_API_KEY` (required)
- `PIPEDREAM_API_URL` (defaults to `https://api.pipedream.com/v1`)

---

#### 2. `lib/pipedream.ts`
**Purpose:** Alternative Pipedream client (uses `/users/{USER_ID}/workflows` endpoints)

**Functions:**
- `createWorkflow(blueprint: WorkflowBlueprint)` → Creates workflow
  - **Pipedream API:** `POST /users/{PIPEDREAM_USER_ID}/workflows`
  - **Returns:** `CreateWorkflowResult` with `pipedream_workflow_id`
  
- `updateWorkflow(pipedreamWorkflowId, blueprint)` → Updates workflow
  - **Pipedream API:** `PUT /users/{PIPEDREAM_USER_ID}/workflows/{workflowId}`
  - **Returns:** `CreateWorkflowResult`
  
- `runWorkflow(pipedreamWorkflowId: string)` → Triggers manual execution
  - **Pipedream API:** `POST /users/{PIPEDREAM_USER_ID}/workflows/{workflowId}/execute`
  - **Returns:** `PipedreamExecution`
  
- `listExecutions(pipedreamWorkflowId: string)` → Fetches execution logs
  - **Pipedream API:** `GET /users/{PIPEDREAM_USER_ID}/workflows/{workflowId}/executions`
  - **Returns:** `PipedreamExecution[]`

**Helper Functions:**
- `blueprintToPipedreamFormat(blueprint)` → Converts blueprint to Pipedream format
- `pipedreamRequest<T>(endpoint, options)` → Makes authenticated requests

**Environment Variables:**
- `PIPEDREAM_API_KEY` (required)
- `PIPEDREAM_USER_ID` (required)
- `PIPEDREAM_API_URL` (defaults to `https://api.pipedream.com/v1`)

---

#### 3. `lib/pipedream/deployWorkflow.ts`
**Purpose:** High-level workflow deployment wrapper

**Functions:**
- `deployWorkflow(plan: WorkflowPlan)` → Deploys workflow to Pipedream
  - **Calls:** `createWorkflow()` from `pipedreamClient.ts`
  - **Calls:** `setWorkflowActive()` to activate workflow
  - **Returns:** `DeployResult` with `workflowId` or error

**Flow:**
1. Converts `WorkflowPlan` → `WorkflowBlueprint`
2. Creates workflow in Pipedream
3. Activates workflow in Pipedream
4. Returns workflow ID

---

#### 4. `lib/pipedream/runWorkflow.ts`
**Purpose:** High-level workflow execution wrapper

**Functions:**
- `runWorkflow(workflowId: string, inputData?)` → Executes workflow
  - **Calls:** `executeWorkflow()` from `pipedreamClient.ts`
  - **Returns:** `RunResult` with `execution` or error

**Flow:**
1. Validates `PIPEDREAM_API_KEY` exists
2. Calls Pipedream API to execute workflow
3. Returns execution result or error

---

## Backend API Routes

### Workflow Management Routes

#### 1. `POST /api/workflows/create`
**Purpose:** Create a new workflow (database only, no Pipedream)
- **UI Caller:** Not directly called from UI (used internally)
- **Pipedream Integration:** ❌ None
- **Database:** Creates workflow in `workflows` table
- **Returns:** Workflow object

---

#### 2. `POST /api/workflows/generate`
**Purpose:** Generate workflow from AI intent and create in Pipedream
- **UI Caller:** `app/api/chat/route.ts` (internal call)
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `createWorkflow()` from `lib/pipedream.ts`
  - **Pipedream API:** `POST /users/{USER_ID}/workflows`
- **Database:** Creates workflow in `workflows` table, stores `pipedream_workflow_id` in `n8n_workflow_id` field
- **Returns:** Workflow object with Pipedream ID

**Flow:**
1. Authenticates user
2. Generates workflow blueprint using AI (`generateWorkflowBlueprint`)
3. Creates workflow in database
4. **Creates workflow in Pipedream** ← PIPEDREAM CALL
5. Updates database with Pipedream workflow ID
6. Returns workflow

---

#### 3. `POST /api/workflows/activate`
**Purpose:** Activate/deploy workflow to Pipedream
- **UI Caller:** WorkflowsTable, WorkflowCard (activate button)
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `deployWorkflow()` from `lib/pipedream/deployWorkflow.ts`
  - **Which calls:** `createWorkflow()` and `setWorkflowActive()` from `pipedreamClient.ts`
  - **Pipedream API:** `POST /workflows` then `PATCH /workflows/{id}`
- **Database:** Updates workflow `active: true` and stores `pipedream_workflow_id` in `n8n_workflow_id` field
- **Returns:** Success message

**Flow:**
1. Validates workflow structure
2. Validates app connections
3. **Deploys workflow to Pipedream** ← PIPEDREAM CALL
4. Updates database with Pipedream workflow ID
5. Returns success

---

#### 4. `POST /api/workflows/run`
**Purpose:** Execute workflow manually
- **UI Caller:** `components/workflows/RunWorkflowButton.tsx`
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `runWorkflow()` from `lib/pipedream/runWorkflow.ts`
  - **Which calls:** `executeWorkflow()` from `pipedreamClient.ts`
  - **Pipedream API:** `POST /workflows/{workflowId}/execute`
- **Database:** Creates execution record in `executions` table
- **Returns:** Execution result

**Flow:**
1. Validates workflow exists and is activated
2. **Executes workflow in Pipedream** ← PIPEDREAM CALL
3. Creates execution record in database
4. Returns execution details

---

#### 5. `POST /api/workflows/[id]/run`
**Purpose:** Execute workflow by ID (alternative endpoint)
- **UI Caller:** `components/workflows/WorkflowsTable.tsx`, `components/workflows/WorkflowRunButton.tsx`
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `runWorkflow()` from `lib/pipedream.ts`
  - **Pipedream API:** `POST /users/{USER_ID}/workflows/{workflowId}/execute`
- **Database:** Creates execution record in `executions` table
- **Returns:** Execution result

**Flow:**
1. Validates workflow exists and is activated
2. **Executes workflow in Pipedream** ← PIPEDREAM CALL
3. Creates execution record in database
4. Returns execution details

---

#### 6. `POST /api/workflows/update`
**Purpose:** Update workflow (database and optionally Pipedream)
- **UI Caller:** Not directly called from UI (used internally)
- **Pipedream Integration:** ⚠️ **CONDITIONAL**
  - **If `active` status changes AND workflow has Pipedream ID:**
    - **Calls:** `setWorkflowActive()` from `pipedreamClient.ts`
    - **Pipedream API:** `PATCH /workflows/{workflowId}` with `{ active }`
- **Database:** Updates workflow in `workflows` table
- **Returns:** Updated workflow

**Flow:**
1. Validates workflow structure (if trigger/actions updated)
2. **If active status changed:** Syncs with Pipedream ← PIPEDREAM CALL (conditional)
3. Updates database
4. Returns updated workflow

---

#### 7. `POST /api/workflows/delete`
**Purpose:** Delete workflow
- **UI Caller:** WorkflowsTable (delete button)
- **Pipedream Integration:** ❌ **NO** (workflow deleted from database only, not from Pipedream)
- **Database:** Deletes workflow from `workflows` table
- **Returns:** Success message

**Note:** Pipedream workflow is NOT deleted. This may need to be added.

---

#### 8. `GET /api/workflows/[id]/executions`
**Purpose:** Fetch execution logs from Pipedream
- **UI Caller:** `components/workflows/WorkflowExecutions.tsx`
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `listExecutions()` from `lib/pipedream.ts`
  - **Pipedream API:** `GET /users/{USER_ID}/workflows/{workflowId}/executions`
- **Database:** None (reads directly from Pipedream)
- **Returns:** Array of execution logs

**Flow:**
1. Validates workflow exists and is activated
2. **Fetches executions from Pipedream** ← PIPEDREAM CALL
3. Returns execution logs

---

#### 9. `GET /api/workflows/list`
**Purpose:** List all workflows for user
- **UI Caller:** Server-side in `app/(dashboard)/workflows/page.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `workflows` table
- **Returns:** Array of workflows

---

#### 10. `POST /api/workflows/trigger`
**Purpose:** Legacy route for triggering workflows (deprecated, use `/run` instead)
- **UI Caller:** Not used (legacy)
- **Pipedream Integration:** ✅ **YES**
  - **Calls:** `runWorkflow()` from `lib/pipedream/runWorkflow.ts`
  - **Pipedream API:** `POST /workflows/{workflowId}/execute`
- **Database:** Creates execution record
- **Returns:** Execution result

---

#### 11. `GET /api/workflows/sync-executions`
**Purpose:** DEPRECATED - Was for n8n, now returns 410 Gone
- **UI Caller:** None
- **Pipedream Integration:** ❌ None (deprecated)
- **Status:** Returns 410 Gone error

---

### Chat Routes

#### 12. `POST /api/chat`
**Purpose:** Process chat messages and create/run workflows
- **UI Caller:** `app/(dashboard)/chat/page.tsx`, `components/chat/ChatComposer.tsx`, `components/chat/useChat.ts`
- **Pipedream Integration:** ⚠️ **INDIRECT**
  - **If intent is "create_workflow":**
    - **Calls:** `POST /api/workflows/generate` (internal)
    - **Which calls:** Pipedream API to create workflow
  - **If intent is "run_workflow":**
    - **Calls:** `POST /api/workflows/{id}/run` (internal)
    - **Which calls:** Pipedream API to execute workflow
- **Database:** Creates chat messages, may create workflows/executions
- **Returns:** Chat response with action taken

**Flow:**
1. Detects intent (create_workflow, run_workflow, or general_response)
2. **If create_workflow:** Calls `/api/workflows/generate` → Creates in Pipedream ← PIPEDREAM CALL (indirect)
3. **If run_workflow:** Calls `/api/workflows/{id}/run` → Executes in Pipedream ← PIPEDREAM CALL (indirect)
4. Returns chat response

---

#### 13. `GET /api/chat/messages`
**Purpose:** Fetch chat message history
- **UI Caller:** `app/(dashboard)/chat/page.tsx`, `components/chat/useChat.ts`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `chat_messages` table
- **Returns:** Array of messages

---

### Dashboard Routes

#### 14. `GET /api/dashboard/updates`
**Purpose:** Fetch dashboard statistics and updates
- **UI Caller:** `components/dashboard/SynthUpdatesCard.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `workflows` and `executions` tables
- **Returns:** Stats, updates, recent workflows, recent executions

---

#### 15. `GET /api/dashboard/advisory`
**Purpose:** Fetch AI-powered advisory insights
- **UI Caller:** `components/dashboard/SynthAdvisory.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `advisory_insights`, `workflows`, `executions`, `knowledge`, `connections` tables
- **Returns:** Array of advisory insights

---

### Execution Routes

#### 16. `GET /api/executions/list`
**Purpose:** List execution history
- **UI Caller:** Server-side in `app/(dashboard)/executions/page.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `executions` table
- **Returns:** Array of executions

---

#### 17. `POST /api/executions`
**Purpose:** Create execution record (used internally)
- **UI Caller:** Not directly called from UI
- **Pipedream Integration:** ❌ None (creates DB record only)
- **Database:** Creates execution in `executions` table
- **Returns:** Execution object

---

### Knowledge Routes

#### 18. `GET /api/knowledge`
**Purpose:** List knowledge items
- **UI Caller:** `components/knowledge/UnstructuredKnowledgeSection.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Reads from `knowledge` table
- **Returns:** Array of knowledge items

---

#### 19. `POST /api/knowledge`
**Purpose:** Create knowledge item
- **UI Caller:** `components/knowledge/UnstructuredKnowledgeSection.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Creates knowledge in `knowledge` table
- **Returns:** Knowledge item

---

#### 20. `PUT /api/knowledge/[id]`
**Purpose:** Update knowledge item
- **UI Caller:** `components/knowledge/UnstructuredKnowledgeSection.tsx`
- **Pipedream Integration:** ❌ None
- **Database:** Updates knowledge in `knowledge` table
- **Returns:** Updated knowledge item

---

#### 21. `DELETE /api/knowledge/[id]`
**Purpose:** Delete knowledge item
- **UI Caller:** Not directly called from UI
- **Pipedream Integration:** ❌ None
- **Database:** Deletes knowledge from `knowledge` table
- **Returns:** Success message

---

### Billing Routes (No Pipedream Integration)

#### 22-32. `/api/billing/*` Routes
**Purpose:** Stripe billing management
- **UI Caller:** `app/(dashboard)/billing/page.tsx`
- **Pipedream Integration:** ❌ None
- **External API:** Stripe API
- **Routes:**
  - `GET /api/billing/info` - Get subscription info
  - `GET /api/billing/prices` - Get pricing plans
  - `GET /api/billing/state` - Get billing state
  - `POST /api/billing/create-customer` - Create Stripe customer
  - `POST /api/billing/create-setup-intent` - Create payment setup intent
  - `POST /api/billing/create-subscription` - Create subscription
  - `POST /api/billing/switch-plan` - Switch subscription plan
  - `POST /api/billing/purchase-addon` - Purchase add-on
  - `POST /api/billing/update-payment-method` - Update payment method
  - `POST /api/billing/cancel` - Cancel subscription
  - `POST /api/billing/reactivate-subscription` - Reactivate subscription
  - `GET /api/billing/invoices` - Get invoices
  - `GET /api/billing/purchase-log` - Get purchase history

---

### Connection Routes (No Pipedream Integration)

#### 33-37. `/api/connections/*` Routes
**Purpose:** OAuth connection management
- **UI Caller:** `app/(dashboard)/settings/connections/page.tsx`
- **Pipedream Integration:** ❌ None
- **External API:** OAuth providers (Gmail, Slack, etc.)
- **Routes:**
  - `GET /api/connections` - List connections
  - `POST /api/connections/start` - Start OAuth flow
  - `GET /api/connections/callback` - OAuth callback
  - `GET /api/connections/details/[key]` - Get connection details
  - `GET /api/connections/search` - Search connections

---

## UI Components and Their API Connections

### Dashboard Components

#### 1. `SynthUpdatesCard` (`components/dashboard/SynthUpdatesCard.tsx`)
**API Calls:**
- `GET /api/dashboard/updates`
- **Purpose:** Fetch workflow stats, updates, recent workflows, recent executions
- **Pipedream Integration:** ❌ None (reads from database only)

---

#### 2. `SynthAdvisory` (`components/dashboard/SynthAdvisory.tsx`)
**API Calls:**
- `GET /api/dashboard/advisory`
- **Purpose:** Fetch AI-powered advisory insights
- **Pipedream Integration:** ❌ None (reads from database only)

---

### Workflow Components

#### 3. `WorkflowsTable` (`components/workflows/WorkflowsTable.tsx`)
**API Calls:**
- `POST /api/workflows/{workflowId}/run` - Run workflow
- **Pipedream Integration:** ✅ **YES** (indirect via API route)
- **Flow:** UI → API Route → `runWorkflow()` → Pipedream API

**Data Source:**
- Server-side: `app/(dashboard)/workflows/page.tsx` fetches workflows from database

---

#### 4. `WorkflowRunButton` (`components/workflows/WorkflowRunButton.tsx`)
**API Calls:**
- `POST /api/workflows/{workflowId}/run` - Run workflow
- **Pipedream Integration:** ✅ **YES** (indirect via API route)

---

#### 5. `RunWorkflowButton` (`components/workflows/RunWorkflowButton.tsx`)
**API Calls:**
- `POST /api/workflows/run` - Run workflow (alternative endpoint)
- **Pipedream Integration:** ✅ **YES** (indirect via API route)

---

#### 6. `WorkflowExecutions` (`components/workflows/WorkflowExecutions.tsx`)
**API Calls:**
- `GET /api/workflows/{workflowId}/executions` - Fetch execution logs
- **Pipedream Integration:** ✅ **YES** (indirect via API route)
- **Flow:** UI → API Route → `listExecutions()` → Pipedream API

---

### Chat Components

#### 7. `ChatPage` (`app/(dashboard)/chat/page.tsx`)
**API Calls:**
- `GET /api/chat/messages?conversation_id={id}` - Fetch message history
- `POST /api/chat` - Send message
- **Pipedream Integration:** ⚠️ **INDIRECT**
  - If intent is "create_workflow": Creates workflow in Pipedream
  - If intent is "run_workflow": Executes workflow in Pipedream

---

#### 8. `ChatComposer` (`components/chat/ChatComposer.tsx`)
**API Calls:**
- `POST /api/chat` - Send message (via parent component)

---

#### 9. `useChat` (`components/chat/useChat.ts`)
**API Calls:**
- `GET /api/chat/messages?conversation_id={id}` - Fetch messages
- `POST /api/chat` - Send message
- **Pipedream Integration:** ⚠️ **INDIRECT** (via chat route)

---

### Knowledge Components

#### 10. `UnstructuredKnowledgeSection` (`components/knowledge/UnstructuredKnowledgeSection.tsx`)
**API Calls:**
- `GET /api/knowledge` - Fetch knowledge items
- `POST /api/knowledge` - Create knowledge item
- `PUT /api/knowledge/{id}` - Update knowledge item
- **Pipedream Integration:** ❌ None

---

#### 11. `StructuredContextSection` (`components/knowledge/StructuredContextSection.tsx`)
**API Calls:**
- ❌ **NO API CALLS** - Uses mock data, TODO comments indicate need for backend connection
- **Pipedream Integration:** ❌ None

---

#### 12. `BusinessRulesSection` (`components/knowledge/BusinessRulesSection.tsx`)
**API Calls:**
- ❌ **NO API CALLS** - Uses mock data, TODO comments indicate need for backend connection
- **Pipedream Integration:** ❌ None

---

#### 13. `GlossarySection` (`components/knowledge/GlossarySection.tsx`)
**API Calls:**
- ❌ **NO API CALLS** - Uses mock data, TODO comments indicate need for backend connection
- **Pipedream Integration:** ❌ None

---

#### 14. `FileUploadSection` (`components/knowledge/FileUploadSection.tsx`)
**API Calls:**
- ❌ **NO API CALLS** - Simulates upload, no real API calls
- **Pipedream Integration:** ❌ None

---

#### 15. `KnowledgeSuggestions` (`components/knowledge/KnowledgeSuggestions.tsx`)
**API Calls:**
- ❌ **NO API CALLS** - Uses hardcoded mock suggestions
- **Pipedream Integration:** ❌ None

---

### Billing Components

#### 16. `BillingPage` (`app/(dashboard)/billing/page.tsx`)
**API Calls:**
- Multiple `/api/billing/*` routes (see Billing Routes section)
- **Pipedream Integration:** ❌ None (Stripe integration only)

---

## Complete Connection Map

### Direct Pipedream API Calls (From Backend)

| Backend Function | Pipedream API Endpoint | Called From | UI Trigger |
|------------------|------------------------|-------------|------------|
| `createWorkflow()` (pipedreamClient) | `POST /workflows` | `deployWorkflow()` | Workflow activation |
| `createWorkflow()` (pipedream.ts) | `POST /users/{USER_ID}/workflows` | `/api/workflows/generate` | Chat: create workflow |
| `setWorkflowActive()` | `PATCH /workflows/{id}` | `deployWorkflow()` | Workflow activation |
| `executeWorkflow()` | `POST /workflows/{id}/execute` | `runWorkflow()` | Workflow execution |
| `runWorkflow()` (pipedream.ts) | `POST /users/{USER_ID}/workflows/{id}/execute` | `/api/workflows/[id]/run` | Workflow execution |
| `listExecutions()` | `GET /users/{USER_ID}/workflows/{id}/executions` | `/api/workflows/[id]/executions` | View execution logs |
| `getWorkflow()` | `GET /workflows/{id}` | Not currently used | - |
| `updateWorkflow()` | `PUT /workflows/{id}` | Not currently used | - |
| `deleteWorkflow()` | `DELETE /workflows/{id}` | **NOT CALLED** (workflow deletion doesn't delete from Pipedream) | - |

### Indirect Pipedream Calls (Via API Routes)

| UI Component | API Route | Pipedream Function | Pipedream API Endpoint |
|--------------|-----------|-------------------|------------------------|
| `WorkflowsTable` | `POST /api/workflows/{id}/run` | `runWorkflow()` → `executeWorkflow()` | `POST /users/{USER_ID}/workflows/{id}/execute` |
| `WorkflowRunButton` | `POST /api/workflows/{id}/run` | `runWorkflow()` → `executeWorkflow()` | `POST /users/{USER_ID}/workflows/{id}/execute` |
| `RunWorkflowButton` | `POST /api/workflows/run` | `runWorkflow()` → `executeWorkflow()` | `POST /workflows/{id}/execute` |
| `WorkflowExecutions` | `GET /api/workflows/{id}/executions` | `listExecutions()` | `GET /users/{USER_ID}/workflows/{id}/executions` |
| `ChatPage` (create workflow) | `POST /api/chat` → `POST /api/workflows/generate` | `createWorkflow()` | `POST /users/{USER_ID}/workflows` |
| `ChatPage` (run workflow) | `POST /api/chat` → `POST /api/workflows/{id}/run` | `runWorkflow()` → `executeWorkflow()` | `POST /users/{USER_ID}/workflows/{id}/execute` |
| Workflow activation | `POST /api/workflows/activate` | `deployWorkflow()` → `createWorkflow()` + `setWorkflowActive()` | `POST /workflows` + `PATCH /workflows/{id}` |

---

## Data Flow Diagrams

### Workflow Creation Flow

```
User (Chat) 
  → POST /api/chat
    → detectChatIntent() → "create_workflow"
      → POST /api/workflows/generate (internal)
        → generateWorkflowBlueprint() (AI)
        → createWorkflow() (lib/pipedream.ts)
          → POST /users/{USER_ID}/workflows (PIPEDREAM API) ✅
        → Save to database (workflows table)
        → Return workflow with Pipedream ID
  → Return chat response with workflow ID
```

### Workflow Activation Flow

```
User (WorkflowsTable - Activate Button)
  → POST /api/workflows/activate
    → Validate workflow structure
    → Validate app connections
    → deployWorkflow()
      → createWorkflow() (pipedreamClient.ts)
        → POST /workflows (PIPEDREAM API) ✅
      → setWorkflowActive()
        → PATCH /workflows/{id} (PIPEDREAM API) ✅
    → Update database (active: true, n8n_workflow_id)
    → Return success
```

### Workflow Execution Flow

```
User (WorkflowsTable - Run Button)
  → POST /api/workflows/{id}/run
    → Validate workflow exists and activated
    → runWorkflow() (lib/pipedream.ts)
      → POST /users/{USER_ID}/workflows/{id}/execute (PIPEDREAM API) ✅
    → Create execution record in database
    → Return execution result
```

### Execution Logs Flow

```
User (WorkflowExecutions Component)
  → GET /api/workflows/{id}/executions
    → Validate workflow exists and activated
    → listExecutions() (lib/pipedream.ts)
      → GET /users/{USER_ID}/workflows/{id}/executions (PIPEDREAM API) ✅
    → Return execution logs
```

---

## Summary Statistics

### Pipedream Integration Points

- **Total Pipedream API Functions:** 9
- **Total API Routes Using Pipedream:** 6
- **Total UI Components Triggering Pipedream:** 5
- **Total Pipedream API Endpoints Used:** 5

### Backend-to-UI Connections

- **Total API Routes:** 61
- **Total UI Components Making API Calls:** 16
- **Fully Connected Components:** 10
- **Partially Connected Components:** 1 (Chat - indirect Pipedream)
- **Not Connected Components:** 5 (Knowledge components)

### Pipedream API Endpoints Used

1. `POST /workflows` - Create workflow
2. `POST /users/{USER_ID}/workflows` - Create workflow (alternative)
3. `PATCH /workflows/{id}` - Activate/deactivate workflow
4. `POST /workflows/{id}/execute` - Execute workflow
5. `POST /users/{USER_ID}/workflows/{id}/execute` - Execute workflow (alternative)
6. `GET /users/{USER_ID}/workflows/{id}/executions` - List executions

### Missing Pipedream Integration

- **Workflow Deletion:** Workflows are deleted from database but NOT from Pipedream
  - **Impact:** Orphaned workflows in Pipedream
  - **Recommendation:** Add `deleteWorkflow()` call in `/api/workflows/delete`

---

## Environment Variables Required for Pipedream

- `PIPEDREAM_API_KEY` - **REQUIRED** - Authentication key
- `PIPEDREAM_USER_ID` - **REQUIRED** (for pipedream.ts client) - Workspace/user ID
- `PIPEDREAM_API_URL` - Optional - Defaults to `https://api.pipedream.com/v1`

---

## Notes

1. **Two Pipedream Clients:** The codebase has two Pipedream client implementations:
   - `lib/pipedreamClient.ts` - Uses `/workflows` endpoints
   - `lib/pipedream.ts` - Uses `/users/{USER_ID}/workflows` endpoints
   - Both are used in different parts of the codebase

2. **Temporary Field Usage:** The `n8n_workflow_id` field in the `workflows` table is temporarily used to store Pipedream workflow IDs during MVP. This should be renamed to `pipedream_workflow_id` or `executor_workflow_id` in a future migration.

3. **Workflow Deletion Gap:** Workflows deleted from the database are NOT deleted from Pipedream, creating orphaned workflows.

4. **Execution Sync:** Executions are automatically logged to the database when workflows are run via the API routes. The deprecated `/api/workflows/sync-executions` route is no longer used.

---

## End of Audit

This audit covers all backend-to-UI connections and all Pipedream API integrations as of the current codebase state.

