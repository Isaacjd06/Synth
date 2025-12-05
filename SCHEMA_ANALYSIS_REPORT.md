# SYNTH DATABASE SCHEMA ANALYSIS REPORT

**Generated:** 2025-01-XX  
**Scope:** Repository-wide analysis of database requirements for MVP + Level 3 readiness  
**Database:** Neon (PostgreSQL) via Prisma ORM

---

## EXECUTIVE SUMMARY

This analysis examined all API routes, library files, UI components, and knowledge base documentation to determine the complete database schema requirements for Synth. The analysis identified **critical bugs**, **missing fields**, and **unused models** that need to be addressed.

---

## A. TABLES_REQUIRED

Based on comprehensive codebase analysis, Synth requires the following tables for MVP + Level 3:

### Core Tables (ACTIVELY USED)

1. **User** ✅
   - **Status:** Correctly defined
   - **Usage:** Used in all API routes for user management, workflow ownership, connections, memory, chat
   - **Fields Used:** `id`, `email`, `name`, `created_at`

2. **Workflows** ✅ (with minor issues)
   - **Status:** Mostly correct, missing `updated_at`
   - **Usage:** Core workflow management in `/api/workflows/*`
   - **Fields Used:** `id`, `user_id`, `name`, `description`, `intent`, `trigger` (Json), `actions` (Json), `active`, `n8n_workflow_id`, `created_at`
   - **Note:** `n8n_workflow_id` temporarily stores Pipedream workflow ID (as documented in schema comments)

3. **Execution** ⚠️ (CRITICAL ISSUES)
   - **Status:** Missing critical fields, model name mismatch in code
   - **Usage:** Execution logging in `/api/executions/*`, `/api/workflows/run`, sync operations
   - **Fields Currently Used:** `id`, `workflow_id`, `user_id`, `input_data`, `output_data`, `created_at`, `finished_at`
   - **Fields MISSING:** `status`, `pipedream_execution_id` (or `executor_execution_id`)
   - **CRITICAL BUG:** Code uses `prisma.executions` (plural) but model is `Execution` (should be `prisma.execution`)

4. **Connection** ✅
   - **Status:** Correctly defined
   - **Usage:** Connection management in `/api/connections`
   - **Fields Used:** `id`, `user_id`, `service_name`, `status`, `connection_type`, `created_at`, `last_verified`

5. **Memory** ✅
   - **Status:** Correctly defined
   - **Usage:** Memory system in `/api/memory/*`, `/api/brain`
   - **Fields Used:** `id`, `user_id`, `context_type`, `content`, `relevance_score`, `created_at`, `last_accessed`, `metadata`

6. **ChatMessage** ✅
   - **Status:** Correctly defined
   - **Usage:** Chat functionality in `/api/chat`
   - **Fields Used:** `id`, `user_id`, `role`, `content`, `conversation_id`, `created_at`, `metadata`

### Optional/Future Tables (DEFINED BUT NOT USED IN CODE)

7. **CoreFramework** ⚠️
   - **Status:** Defined but not used in any API routes
   - **Usage:** No API routes found using this model
   - **Recommendation:** Keep if planned for future use, otherwise remove for MVP

8. **Knowledge** ⚠️
   - **Status:** Defined but not used in any API routes
   - **Usage:** No API routes found using this model
   - **Recommendation:** Remove for MVP unless knowledgebase file uploads are planned

### Unused Memory-Related Models (NOT USED IN CODE)

The following models are defined in the schema but **not used anywhere** in the codebase:

9. **MemoryCategory** ❌
10. **MemoryItem** ❌
11. **MemoryActionsTaken** ❌
12. **MemoryStrategy** ❌
13. **MemoryAutomation** ❌
14. **MemoryPainPoint** ❌
15. **MemoryOpportunity** ❌
16. **MemoryRoadmap** ❌

**Recommendation:** These models should be **removed** for MVP unless they are planned for future Level 3 features. They add complexity without current functionality.

---

## B. TABLES_MISSING

**No missing tables identified.** All required tables exist in the schema.

However, **critical fields are missing** from existing tables (see COLUMN_MISMATCHES below).

---

## C. COLUMN_MISMATCHES

### CRITICAL ISSUES

#### 1. Execution Model - Missing `status` Field ⚠️ CRITICAL

**Issue:** The `Execution` model is missing a `status` field that is:
- Referenced in `/app/api/workflows/sync-executions/route.ts` (line 146)
- Expected by knowledge base documentation (`knowledge/schemas/database-schema.md`)
- Required for tracking execution state (`success` | `failure` | `running` | `unknown`)

**Current Schema:**
```prisma
model Execution {
  id          String    @id @default(uuid())
  workflow_id String
  user_id     String
  input_data  Json?
  output_data Json?
  created_at  DateTime  @default(now())
  finished_at DateTime?
  // MISSING: status field
}
```

**Required Addition:**
```prisma
status String? @default("unknown") // "success" | "failure" | "running" | "unknown"
```

**Impact:** High - Execution sync functionality will fail, status tracking is broken

---

#### 2. Execution Model - Missing `pipedream_execution_id` Field ⚠️ CRITICAL

**Issue:** The `Execution` model is missing an external execution ID field that is:
- Referenced in `/app/api/workflows/sync-executions/route.ts` (line 147) as `n8n_execution_id`
- Required for syncing executions from external workflow engines (Pipedream, future n8n)
- Needed to prevent duplicate execution records

**Current Schema:** No field for external execution ID

**Required Addition:**
```prisma
pipedream_execution_id String? // External execution ID from Pipedream (nullable for manual executions)
// OR more generically:
executor_execution_id String? // External execution ID from workflow executor (Pipedream/n8n)
```

**Impact:** High - Execution sync will create duplicates, cannot track external execution references

---

#### 3. Execution Model - Code Uses Wrong Prisma Model Name ⚠️ CRITICAL BUG

**Issue:** Two files use `prisma.executions` (plural) instead of `prisma.execution` (singular):
- `/app/api/executions/list/route.ts` (line 8)
- `/app/api/executions/log/route.ts` (line 22)

**Current Code (INCORRECT):**
```typescript
const data = await prisma.executions.findMany({ ... }); // ❌ WRONG
const saved = await prisma.executions.create({ ... }); // ❌ WRONG
```

**Correct Code:**
```typescript
const data = await prisma.execution.findMany({ ... }); // ✅ CORRECT
const saved = await prisma.execution.create({ ... }); // ✅ CORRECT
```

**Impact:** Critical - These API routes will fail at runtime with Prisma errors

---

#### 4. Workflows Model - Missing `updated_at` Field ⚠️ MODERATE

**Issue:** The `Workflows` model is missing an `updated_at` field that is:
- Referenced in UI components (`app/workflows/page.tsx` expects `updated_at`)
- Standard practice for tracking modification timestamps
- Useful for workflow versioning and change tracking

**Current Schema:**
```prisma
model Workflows {
  // ...
  created_at        DateTime           @default(now())
  // MISSING: updated_at
}
```

**Required Addition:**
```prisma
updated_at DateTime @updatedAt
```

**Impact:** Moderate - UI may show incorrect "last updated" information

---

### OPTIONAL ENHANCEMENTS (Not Critical for MVP)

#### 5. Execution Model - Additional Fields for Enhanced Tracking

The knowledge base documentation (`lib/knowledge/synth-internal-architecture.md`) suggests additional fields that could enhance execution tracking:

- `duration` (Int?) - Execution time in milliseconds
- `logs` (Json?) - Detailed execution logs
- `error` (String?) - Error message if failed

**Impact:** Low - Current `output_data` Json field can store this information, but dedicated fields improve queryability

---

## D. NO_ACTION_NEEDED

The following tables and fields are correctly defined and match code usage:

✅ **User** - All fields correct  
✅ **Connection** - All fields correct  
✅ **Memory** - All fields correct  
✅ **ChatMessage** - All fields correct  
✅ **Workflows** - Core fields correct (only missing `updated_at`)

---

## SUMMARY OF REQUIRED CHANGES

### Critical (Must Fix)

1. **Fix Prisma model name usage:**
   - Change `prisma.executions` → `prisma.execution` in:
     - `app/api/executions/list/route.ts`
     - `app/api/executions/log/route.ts`

2. **Add missing Execution fields:**
   - Add `status String? @default("unknown")` to Execution model
   - Add `pipedream_execution_id String?` (or `executor_execution_id String?`) to Execution model

### Recommended (Should Fix)

3. **Add `updated_at` field to Workflows model:**
   - Add `updated_at DateTime @updatedAt` to Workflows model

### Optional (Cleanup)

4. **Remove unused models** (if not planned for MVP):
   - MemoryCategory
   - MemoryItem
   - MemoryActionsTaken
   - MemoryStrategy
   - MemoryAutomation
   - MemoryPainPoint
   - MemoryOpportunity
   - MemoryRoadmap
   - Knowledge (if not using file uploads)
   - CoreFramework (if not using framework system)

---

## CLAUDE PROMPT FOR SCHEMA UPDATES

Since changes ARE needed, here is the prompt for Claude Code:

---

**PROMPT FOR CLAUDE CODE:**

You are tasked with updating the Prisma schema (`prisma/schema.prisma`) and fixing related code issues in the Synth project. Follow these instructions carefully:

### TASK 1: Fix Critical Prisma Model Name Bugs

**Files to fix:**
1. `app/api/executions/list/route.ts` - Line 8: Change `prisma.executions` to `prisma.execution`
2. `app/api/executions/log/route.ts` - Line 22: Change `prisma.executions` to `prisma.execution`

**Action:** Replace all instances of `prisma.executions` with `prisma.execution` in these files. Prisma models are accessed in camelCase singular form, not plural.

---

### TASK 2: Add Missing Fields to Execution Model

**File:** `prisma/schema.prisma`

**Add the following fields to the `Execution` model:**

```prisma
model Execution {
  id                    String    @id @default(uuid())
  workflow_id           String
  user_id               String
  input_data            Json?
  output_data           Json?
  status                String?   @default("unknown") // "success" | "failure" | "running" | "unknown"
  pipedream_execution_id String?  // External execution ID from Pipedream (nullable for manual executions)
  created_at            DateTime  @default(now())
  finished_at           DateTime?
  user                  User      @relation(fields: [user_id], references: [id])
  workflow              Workflows @relation(fields: [workflow_id], references: [id])
}
```

**Important Notes:**
- Add `status` field as nullable String with default "unknown"
- Add `pipedream_execution_id` field as nullable String
- Maintain all existing fields and relationships
- Keep field order consistent with existing schema style

---

### TASK 3: Add `updated_at` Field to Workflows Model

**File:** `prisma/schema.prisma`

**Add to the `Workflows` model:**

```prisma
model Workflows {
  // ... existing fields ...
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt  // ADD THIS LINE
  executions        Execution[]
  // ... rest of model ...
}
```

**Important Notes:**
- Use `@updatedAt` directive so Prisma automatically updates this field
- Place after `created_at` for consistency

---

### TASK 4: Update Code That Uses Execution Status

**Files that may need updates:**
- `app/api/workflows/sync-executions/route.ts` - Already uses `status` field (line 146), ensure it works with new schema
- `app/api/workflows/run/route.ts` - May need to set `status` field when creating executions
- `app/api/executions/route.ts` - May need to handle `status` field in create/update operations

**Action:** Review these files and ensure:
1. Execution creation sets `status` appropriately ("success", "failure", "running")
2. Execution updates can modify `status` field
3. Execution queries can filter by `status` if needed

---

### TASK 5: Generate and Apply Migration

**After schema changes:**
1. Run `npx prisma format` to validate schema syntax
2. Run `npx prisma migrate dev --name add_execution_fields_and_workflow_updated_at` to create migration
3. Verify migration SQL looks correct
4. Test that existing data is preserved (nullable fields allow this)

---

### CONSTRAINTS AND REQUIREMENTS

1. **DO NOT delete or rename existing tables** - Only add fields
2. **DO NOT remove existing fields** - Only add new ones
3. **Maintain relational integrity** - All foreign keys must remain valid
4. **Use nullable fields** where appropriate to avoid breaking existing data
5. **Follow Prisma naming conventions** - Use camelCase for field names
6. **Update TypeScript types** - Run `npx prisma generate` after schema changes
7. **Test all affected API routes** - Ensure no runtime errors

---

### VERIFICATION CHECKLIST

After making changes, verify:
- [ ] Schema file syntax is valid (`npx prisma format` succeeds)
- [ ] Migration generates without errors
- [ ] All Prisma model references use correct singular form (`prisma.execution`, not `prisma.executions`)
- [ ] Execution creation/update code handles new `status` and `pipedream_execution_id` fields
- [ ] No existing functionality is broken
- [ ] TypeScript compilation succeeds

---

**END OF PROMPT**

---

## APPENDIX: CODE REFERENCES

### Files Using Execution Model (Incorrectly)
- `app/api/executions/list/route.ts:8` - Uses `prisma.executions.findMany`
- `app/api/executions/log/route.ts:22` - Uses `prisma.executions.create`

### Files Using Execution Model (Correctly)
- `app/api/executions/route.ts` - Uses `prisma.execution` correctly
- `app/api/workflows/run/route.ts` - Uses `prisma.execution.create` correctly

### Files Expecting Execution Status
- `app/api/workflows/sync-executions/route.ts:146` - Sets `status: status` when inserting
- `components/workflows/ExecutionHistory.tsx:35` - Derives status from `output_data?.error`

### Files Expecting Workflow updated_at
- `app/workflows/page.tsx:12` - Interface expects `updated_at?: string`

---

**Report Complete**

