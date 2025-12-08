# UI-to-Backend Connection Analysis

## Critical Fix: Redirect Callback

**Issue Found:** The redirect callback in `lib/auth.ts` was allowing ALL `/api/auth/` URLs to pass through, including error pages. When NextAuth encountered a Configuration error, it redirected to `/api/auth/error?error=Configuration`, and our callback allowed it through instead of redirecting to dashboard.

**Fix Applied:** Modified the redirect callback to:
- Only allow `/api/auth/callback` and `/api/auth/signin` URLs to pass through
- Explicitly redirect error pages (`/api/auth/error`) to dashboard instead
- This ensures users always reach the dashboard after successful login, even if there's a configuration error

---

## Dashboard Page Analysis

### ✅ Connected Components

#### 1. **SynthUpdatesCard** (`components/dashboard/SynthUpdatesCard.tsx`)
- **Backend API:** `/api/dashboard/updates`
- **Purpose:** Displays factual, operational updates about workflows and executions
- **Data Fetched:**
  - Stats: active workflows, total executions, executions last 24h, success rate
  - Recent alerts/updates (workflows never run, recent failures, low success rates)
  - Recent workflows (last 3)
  - Recent executions (last 3)
- **Status:** ✅ Fully connected - fetches from API, handles errors gracefully with placeholder data
- **Backend Route:** `app/api/dashboard/updates/route.ts` - ✅ Exists and working

#### 2. **SynthAdvisory** (`components/dashboard/SynthAdvisory.tsx`)
- **Backend API:** `/api/dashboard/advisory`
- **Purpose:** AI-powered insights and recommendations based on workflow patterns
- **Data Fetched:**
  - Advisory insights (workflow patterns, execution stats, knowledge base usage, connection usage)
  - Insights are generated from database analysis and stored in `advisory_insights` table
- **Status:** ✅ Fully connected - fetches from API, handles errors gracefully
- **Backend Route:** `app/api/dashboard/advisory/route.ts` - ✅ Exists and working

#### 3. **SubscriptionInactiveBanner** (`components/subscription/SubscriptionInactiveBanner.tsx`)
- **Backend API:** Likely uses session data or `/api/billing/info`
- **Purpose:** Shows banner if subscription is inactive
- **Status:** ✅ Connected (uses session data)

---

## Workflows Page Analysis

### ✅ Connected Components

#### 1. **WorkflowsTable** (`components/workflows/WorkflowsTable.tsx`)
- **Backend API:**
  - GET: Server-side fetch in `app/(dashboard)/workflows/page.tsx` (uses Prisma directly)
  - POST: `/api/workflows/{id}/run` for running workflows
- **Purpose:** Display and manage workflows
- **Data Fetched:**
  - Workflows list (server-side, from Prisma)
  - Can trigger workflow execution
- **Status:** ✅ Fully connected
- **Backend Routes:**
  - `app/(dashboard)/workflows/page.tsx` - ✅ Server-side data fetching
  - `app/api/workflows/[id]/run/route.ts` - ✅ Exists

---

## Chat Page Analysis

### ✅ Connected Components

#### 1. **ChatPage** (`app/(dashboard)/chat/page.tsx`)
- **Backend APIs:**
  - GET: `/api/chat/messages?conversation_id={id}` - Fetch message history
  - POST: `/api/chat` - Send new messages
- **Purpose:** AI chat interface for creating workflows via conversation
- **Data Fetched:**
  - Message history (from localStorage session_id)
  - Sends user messages and receives AI responses
- **Status:** ✅ Fully connected
- **Backend Routes:**
  - `app/api/chat/messages/route.ts` - ✅ Exists
  - `app/api/chat/route.ts` - ✅ Exists

---

## Executions Page Analysis

### ✅ Connected Components

#### 1. **ExecutionsTable** (`components/executions/ExecutionsTable.tsx`)
- **Backend API:** Server-side fetch in `app/(dashboard)/executions/page.tsx` (uses Prisma directly)
- **Purpose:** Display execution history
- **Data Fetched:**
  - Recent executions (last 50) with workflow join
- **Status:** ✅ Fully connected
- **Backend Route:** `app/(dashboard)/executions/page.tsx` - ✅ Server-side data fetching

---

## Knowledge Page Analysis

### ⚠️ PARTIALLY CONNECTED / MISSING CONNECTIONS

#### 1. **UnstructuredKnowledgeSection** (`components/knowledge/UnstructuredKnowledgeSection.tsx`)
- **Backend API:** `/api/knowledge`
- **Purpose:** Store unstructured business knowledge (SOPs, scripts, guidelines)
- **Operations:**
  - ✅ GET: Fetches existing knowledge items
  - ✅ POST: Creates new knowledge items
  - ✅ PUT: Updates existing knowledge items
- **Status:** ✅ Fully connected
- **Backend Route:** `app/api/knowledge/route.ts` - ✅ Exists

#### 2. **StructuredContextSection** (`components/knowledge/StructuredContextSection.tsx`)
- **Backend API:** ❌ **NOT CONNECTED** - Uses mock data and TODO comments
- **Purpose:** Store structured business context (company info, products, team, tools)
- **Operations:**
  - ❌ Save button has `TODO: Replace with real API call`
  - ❌ All data is local state only
  - ❌ No persistence to database
- **Status:** ❌ **NEEDS BACKEND CONNECTION**
- **Backend Route:** ❌ **MISSING** - Need to create `/api/knowledge/structured` or extend `/api/knowledge`
- **Data Structure Needed:**
  - Company information (name, industry, target customer, metrics, objectives)
  - Products/Services (name, description, pricing, delivery)
  - Team Members (name, role, responsibilities)
  - Tools & Platforms (list of tools)

#### 3. **BusinessRulesSection** (`components/knowledge/BusinessRulesSection.tsx`)
- **Backend API:** ❌ **NOT CONNECTED** - Uses mock data and TODO comments
- **Purpose:** Define strict business rules that Synth must always obey
- **Operations:**
  - ❌ Add/Edit/Delete all have `TODO: Replace with real API call`
  - ❌ All data is local state only
  - ❌ No persistence to database
- **Status:** ❌ **NEEDS BACKEND CONNECTION**
- **Backend Route:** ❌ **MISSING** - Need to create `/api/knowledge/rules` or extend `/api/knowledge`
- **Data Structure Needed:**
  - Rules table with: id, user_id, content, priority, created_at, updated_at

#### 4. **GlossarySection** (`components/knowledge/GlossarySection.tsx`)
- **Backend API:** ❌ **NOT CONNECTED** - Uses mock data and TODO comments
- **Purpose:** Define specialized terms and acronyms for business language
- **Operations:**
  - ❌ Add/Edit/Delete all have `TODO: Replace with real API call`
  - ❌ All data is local state only
  - ❌ No persistence to database
- **Status:** ❌ **NEEDS BACKEND CONNECTION**
- **Backend Route:** ❌ **MISSING** - Need to create `/api/knowledge/glossary` or extend `/api/knowledge`
- **Data Structure Needed:**
  - Glossary table with: id, user_id, term, definition, created_at, updated_at

#### 5. **FileUploadSection** (`components/knowledge/FileUploadSection.tsx`)
- **Backend API:** ❌ **NOT CONNECTED** - Uses simulated upload (no real API calls)
- **Purpose:** Upload documents (PDF, TXT, Markdown, Word, CSV) to expand knowledge
- **Operations:**
  - ❌ `simulateUpload` function only updates local state
  - ❌ No actual file upload to server
  - ❌ No file processing or storage
- **Status:** ❌ **NEEDS BACKEND CONNECTION**
- **Backend Route:** ❌ **MISSING** - Need to create `/api/knowledge/upload` or file upload endpoint
- **Data Structure Needed:**
  - File storage (S3, local, or database)
  - File metadata table: id, user_id, filename, file_type, file_size, upload_date, status, processed_content
  - File processing pipeline (extract text, parse, store in knowledge base)

#### 6. **KnowledgeSuggestions** (`components/knowledge/KnowledgeSuggestions.tsx`)
- **Backend API:** ❌ **NOT CONNECTED** - Uses hardcoded mock suggestions
- **Purpose:** Show AI-powered suggestions for improving knowledge base
- **Operations:**
  - ❌ All suggestions are hardcoded in `mockSuggestions` array
  - ❌ No API call to generate suggestions
- **Status:** ❌ **NEEDS BACKEND CONNECTION**
- **Backend Route:** ❌ **MISSING** - Need to create `/api/knowledge/suggestions`
- **Logic Needed:**
  - Analyze existing knowledge base
  - Check for missing definitions (terms mentioned but not defined)
  - Suggest connections for tools mentioned
  - Suggest rules based on patterns
  - Suggest workflows based on knowledge

---

## Settings/Connections Page Analysis

### ⚠️ NEEDS VERIFICATION

#### 1. **ConnectionsPage** (`app/(dashboard)/settings/connections/page.tsx`)
- **Backend API:** Need to verify
- **Purpose:** Manage OAuth connections to external services (Gmail, Slack, etc.)
- **Status:** ⚠️ **NEEDS VERIFICATION**
- **Backend Routes:**
  - `app/api/connections/route.ts` - ✅ Exists
  - `app/api/connections/callback/route.ts` - ✅ Exists
  - `app/api/connections/start/route.ts` - ✅ Exists
  - `app/api/connections/details/[key]/route.ts` - ✅ Exists

---

## What Each UI Component is Meant For

### Dashboard Components

1. **SynthUpdatesCard**
   - **Purpose:** "What happened?" - Factual, operational summary
   - **Shows:** Workflow stats, recent executions, alerts (workflows never run, failures, low success rates)
   - **Use Case:** Quick overview of automation health and recent activity

2. **SynthAdvisory**
   - **Purpose:** "What does it mean, and what should I do?" - AI-powered insights
   - **Shows:** Intelligent recommendations based on workflow patterns, execution stats, knowledge usage
   - **Use Case:** Get actionable advice on improving automations

### Knowledge Components

1. **UnstructuredKnowledgeSection**
   - **Purpose:** Store free-form business knowledge
   - **Use Case:** SOPs, sales scripts, support guidelines, writing style, onboarding instructions
   - **Backend:** ✅ Connected

2. **StructuredContextSection**
   - **Purpose:** Store structured business information
   - **Use Case:** Company profile, products/services, team members, tools used
   - **Backend:** ❌ Not connected - needs API endpoint

3. **BusinessRulesSection**
   - **Purpose:** Define strict constraints for automations
   - **Use Case:** Rules like "Never offer discounts >20% without approval", "Always respond within 4 hours"
   - **Backend:** ❌ Not connected - needs API endpoint

4. **GlossarySection**
   - **Purpose:** Define business-specific terms and acronyms
   - **Use Case:** Help Synth understand company jargon (ICP, MRR, CAC, etc.)
   - **Backend:** ❌ Not connected - needs API endpoint

5. **FileUploadSection**
   - **Purpose:** Upload documents to expand knowledge base
   - **Use Case:** Upload PDFs, Word docs, CSVs with business information
   - **Backend:** ❌ Not connected - needs file upload endpoint

6. **KnowledgeSuggestions**
   - **Purpose:** AI-powered suggestions for improving knowledge base
   - **Use Case:** Get recommendations on what to add based on existing knowledge
   - **Backend:** ❌ Not connected - needs suggestion generation endpoint

---

## Summary of Missing Backend Connections

### High Priority (Core Knowledge Features)

1. **StructuredContextSection** - Company info, products, team, tools
   - Need: `/api/knowledge/structured` endpoint
   - Need: Database schema for structured knowledge (or extend `knowledge` table)

2. **BusinessRulesSection** - Business rules
   - Need: `/api/knowledge/rules` endpoint
   - Need: `business_rules` table in Prisma schema

3. **GlossarySection** - Glossary terms
   - Need: `/api/knowledge/glossary` endpoint
   - Need: `glossary` table in Prisma schema

### Medium Priority (File Management)

4. **FileUploadSection** - File uploads
   - Need: `/api/knowledge/upload` endpoint (multipart/form-data)
   - Need: File storage solution (S3, local, or database)
   - Need: File processing pipeline (text extraction, parsing)
   - Need: `knowledge_files` table in Prisma schema

### Low Priority (Enhancements)

5. **KnowledgeSuggestions** - AI suggestions
   - Need: `/api/knowledge/suggestions` endpoint
   - Need: Logic to analyze knowledge base and generate suggestions

---

## Database Schema Additions Needed

Based on the missing connections, we need to add:

1. **business_rules** table:
   ```prisma
   model business_rules {
     id         String   @id @default(uuid())
     user_id   String
     content    String   @db.Text
     priority   String?  @default("medium") // low, medium, high
     created_at DateTime @default(now())
     updated_at DateTime @updatedAt
     User       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
   }
   ```

2. **glossary** table:
   ```prisma
   model glossary {
     id         String   @id @default(uuid())
     user_id   String
     term       String
     definition String   @db.Text
     created_at DateTime @default(now())
     updated_at DateTime @updatedAt
     User       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
     
     @@unique([user_id, term])
   }
   ```

3. **knowledge_files** table:
   ```prisma
   model knowledge_files {
     id              String   @id @default(uuid())
     user_id         String
     filename         String
     file_type        String
     file_size        Int
     storage_path     String? // S3 key or local path
     processed_content String? @db.Text // Extracted text content
     status           String   @default("uploading") // uploading, processing, complete, error
     error_message    String?
     created_at       DateTime @default(now())
     updated_at       DateTime @updatedAt
     User             User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
   }
   ```

4. **structured_knowledge** table (or extend `knowledge` table):
   ```prisma
   model structured_knowledge {
     id              String   @id @default(uuid())
     user_id         String
     type            String   // "company_info", "product", "team_member", "tool"
     data            Json     // Flexible JSON structure for different types
     created_at      DateTime @default(now())
     updated_at      DateTime @updatedAt
     User            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
   }
   ```

---

## Next Steps

1. ✅ **FIXED:** Redirect callback to prevent error page from blocking dashboard access
2. **TODO:** Create database migrations for missing tables (business_rules, glossary, knowledge_files, structured_knowledge)
3. **TODO:** Create API endpoints for missing connections
4. **TODO:** Connect UI components to new API endpoints
5. **TODO:** Implement file upload and processing pipeline
6. **TODO:** Implement knowledge suggestion generation logic

