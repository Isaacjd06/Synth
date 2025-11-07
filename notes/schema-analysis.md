# Database Schema Analysis Report

## Summary
This document analyzes the codebase to identify all database table and column references, compares them with the expected Supabase schema, and identifies potential mismatches that could cause "Failed to send message" or foreign key constraint errors.

---

## Tables Referenced in Code

### 1. `chat_messages` Table

**Columns Used in Code:**
- `id` (UUID) - Referenced when saving user message: `savedUserMessage?.id`
- `user_id` (UUID) - Foreign key to `users` table
- `session_id` (UUID/String) - Session identifier for grouping messages
- `role` (String) - Values: `"user"` or `"assistant"`
- `message` (Text) - The actual message content
- `created_at` (Timestamp) - ISO string format: `new Date().toISOString()`

**Code Locations:**
- `app/api/chat/route.ts` lines 35-45 (user message insert)
- `app/api/chat/route.ts` lines 210-218 (assistant message insert)

**Expected Schema:**
```sql
chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

**Potential Issues:**
- If `user_id` foreign key constraint exists but `users` table doesn't have the TEMP_USER_ID (`00000000-0000-0000-0000-000000000000`), inserts will fail
- If `session_id` is defined as UUID but code passes string, may cause type mismatch
- If `role` CHECK constraint is missing, invalid values could be inserted

---

### 2. `workflows` Table

**Columns Used in Code:**
- `id` (UUID) - Referenced after insert: `insertedWorkflow.id`
- `name` (String) - Workflow name from `workflowBlueprint.name`
- `description` (String) - Workflow description from `workflowBlueprint.description`
- `intent` (String) - Workflow intent from `workflowBlueprint.intent`
- `trigger` (JSONB) - Workflow trigger object from `workflowBlueprint.trigger`
- `actions` (JSONB) - Array of actions from `workflowBlueprint.actions`
- `user_id` (UUID) - Foreign key to `users` table
- `active` (Boolean) - Set to `false` for new workflows
- `n8n_workflow_id` (UUID/String, nullable) - Mentioned in comment but not inserted initially

**Code Locations:**
- `app/api/chat/route.ts` lines 73-86 (workflow insert)

**Expected Schema:**
```sql
workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  intent TEXT NOT NULL,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT false,
  n8n_workflow_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

**Potential Issues:**
- If `trigger` or `actions` columns are TEXT instead of JSONB, JSON serialization will fail
- If `user_id` foreign key constraint exists but TEMP_USER_ID doesn't exist in `users`, insert will fail
- If `active` column doesn't exist or has wrong type, insert will fail
- If `n8n_workflow_id` is required (NOT NULL) but code doesn't provide it, insert will fail

---

### 3. `users` Table

**Columns Used in Code:**
- `id` (UUID) - Referenced as foreign key in `chat_messages.user_id` and `workflows.user_id`
- **No direct inserts/updates** - Code uses hardcoded TEMP_USER_ID: `"00000000-0000-0000-0000-000000000000"`

**Code Locations:**
- `app/api/chat/route.ts` line 6 (TEMP_USER_ID constant)
- Referenced indirectly via foreign keys in `chat_messages` and `workflows`

**Expected Schema:**
```sql
users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Other columns not referenced in code
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Critical Issue:**
- **The code uses a hardcoded UUID that must exist in the `users` table**
- If this UUID doesn't exist, all foreign key inserts to `chat_messages` and `workflows` will fail with foreign key constraint violations
- This is likely the root cause of "Failed to send message" errors

---

### 4. `executions` Table

**Columns Used in Code:**
- **NONE** - Table exists but no code references it yet

**Code Locations:**
- `app/api/executions/route.ts` exists but is empty

**Expected Schema (from API plan):**
```sql
executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Status:** Table exists but unused - no schema mismatch possible yet

---

### 5. `connections` Table

**Columns Used in Code:**
- **NONE** - Table exists but no code references it yet

**Code Locations:**
- `app/api/connections/route.ts` exists but is empty

**Expected Schema (from API plan):**
```sql
connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**Status:** Table exists but unused - no schema mismatch possible yet

---

### 6. `memory` Table

**Columns Used in Code:**
- **NONE** - Table exists but no code references it yet

**Code Locations:**
- `app/api/memory/route.ts` exists but is empty

**Expected Schema (from API plan):**
```sql
memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
)
```

**Status:** Table exists but unused - no schema mismatch possible yet

---

## Foreign Key Relationships

### Expected Architecture:
```
users (1) → (many) workflows
users (1) → (many) chat_messages
workflows (1) → (many) executions (future)
users (1) → (many) connections (future)
users (1) → (many) memory (future)
```

### Current Code Relationships:
- ✅ `chat_messages.user_id` → `users.id` (used)
- ✅ `workflows.user_id` → `users.id` (used)
- ⚠️ **CRITICAL**: Code uses hardcoded `TEMP_USER_ID = "00000000-0000-0000-0000-000000000000"` which must exist in `users` table

---

## Root Cause Analysis

### Why "Failed to send message" Errors Occur:

1. **Missing User Record (MOST LIKELY)**
   - Code inserts into `chat_messages` with `user_id = "00000000-0000-0000-0000-000000000000"`
   - If this UUID doesn't exist in `users` table, foreign key constraint fails
   - Error: `foreign key constraint "chat_messages_user_id_fkey" violated`

2. **Missing Workflow Columns**
   - If `trigger` or `actions` columns don't exist or are wrong type (TEXT vs JSONB)
   - Error: `column "trigger" does not exist` or type mismatch

3. **Missing chat_messages Columns**
   - If `session_id`, `role`, or `message` columns don't exist
   - Error: `column "session_id" does not exist`

4. **Type Mismatches**
   - If `session_id` is UUID but code passes string
   - If `created_at` expects different format
   - Error: `invalid input syntax for type uuid` or timestamp format errors

---

## Verification Checklist

### ✅ Tables That Match Perfectly:
- None yet - need to verify actual schema

### ⚠️ Tables With Potential Mismatches:

#### `chat_messages`:
- [ ] Verify `id` column exists and is UUID PRIMARY KEY
- [ ] Verify `user_id` column exists and has foreign key to `users(id)`
- [ ] Verify `session_id` column exists (check if UUID or TEXT)
- [ ] Verify `role` column exists and accepts "user"/"assistant"
- [ ] Verify `message` column exists and is TEXT
- [ ] Verify `created_at` column exists and accepts timestamps

#### `workflows`:
- [ ] Verify `id` column exists and is UUID PRIMARY KEY
- [ ] Verify `name` column exists and is TEXT
- [ ] Verify `description` column exists (nullable OK)
- [ ] Verify `intent` column exists and is TEXT
- [ ] Verify `trigger` column exists and is JSONB (not TEXT)
- [ ] Verify `actions` column exists and is JSONB (not TEXT)
- [ ] Verify `user_id` column exists and has foreign key to `users(id)`
- [ ] Verify `active` column exists and is BOOLEAN
- [ ] Verify `n8n_workflow_id` column exists and is nullable UUID

#### `users`:
- [ ] **CRITICAL**: Verify user with `id = "00000000-0000-0000-0000-000000000000"` exists
- [ ] If not, either create it or change TEMP_USER_ID in code

---

## Recommended Actions

1. **IMMEDIATE**: Check if user `00000000-0000-0000-0000-000000000000` exists in `users` table
   - If missing, insert it or update code to use existing user ID

2. **VERIFY**: Check column types in Supabase:
   - `workflows.trigger` and `workflows.actions` must be JSONB
   - `chat_messages.session_id` type (UUID vs TEXT)

3. **VERIFY**: Check foreign key constraints:
   - `chat_messages.user_id` → `users.id`
   - `workflows.user_id` → `users.id`

4. **FUTURE**: When implementing other routes:
   - `executions.workflow_id` → `workflows.id`
   - `connections.user_id` → `users.id`
   - `memory.user_id` → `users.id`

---

## Code-to-Schema Mapping Summary

| Table | Columns Used | Columns Expected | Status |
|-------|-------------|------------------|--------|
| `chat_messages` | id, user_id, session_id, role, message, created_at | All 6 columns | ⚠️ Need to verify types |
| `workflows` | id, name, description, intent, trigger, actions, user_id, active, n8n_workflow_id | All 9 columns | ⚠️ Need to verify JSONB types |
| `users` | id (via FK) | id | 🔴 **CRITICAL: TEMP_USER_ID must exist** |
| `executions` | None | workflow_id, status, input, output | ✅ Not used yet |
| `connections` | None | user_id, name, reference | ✅ Not used yet |
| `memory` | None | user_id, key, value | ✅ Not used yet |

