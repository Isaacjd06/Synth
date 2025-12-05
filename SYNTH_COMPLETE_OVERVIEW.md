# SYNTH - COMPLETE SYSTEM OVERVIEW

**Last Updated:** 2025-01-XX  
**Status:** MVP + Level 3 Architecture Ready

---

## 🏗️ ARCHITECTURE OVERVIEW

Synth is a business automation AI platform built on Next.js 16 with a PostgreSQL database (Neon) managed via Prisma ORM. The system uses Pipedream as the primary workflow execution engine (MVP) with n8n support planned for future.

---

## 📊 DATABASE SCHEMA (Prisma + Neon PostgreSQL)

### Core Tables (Active)

1. **User** - User identity and authentication
   - Fields: `id`, `email`, `name`, `created_at`
   - Relations: workflows, executions, connections, memory, chatMessages

2. **Workflows** - Workflow definitions
   - Fields: `id`, `user_id`, `name`, `description`, `intent`, `trigger` (Json), `actions` (Json), `active`, `n8n_workflow_id` (temporarily stores Pipedream ID), `created_at`, `updated_at`
   - Relations: user, executions, memoryAutomations

3. **Execution** - Workflow execution history
   - Fields: `id`, `workflow_id`, `user_id`, `input_data` (Json), `output_data` (Json), `status`, `pipedream_execution_id`, `created_at`, `finished_at`
   - Relations: user, workflow

4. **Connection** - App integration metadata
   - Fields: `id`, `user_id`, `service_name`, `status`, `connection_type`, `created_at`, `last_verified`
   - Note: Credentials NOT stored (security best practice)
   - Relations: user

5. **Memory** - Long-term user context
   - Fields: `id`, `user_id`, `context_type`, `content` (Json), `relevance_score`, `created_at`, `last_accessed`, `metadata` (Json)
   - Relations: user

6. **ChatMessage** - Conversation history
   - Fields: `id`, `user_id`, `role`, `content`, `conversation_id`, `created_at`, `metadata` (Json)
   - Relations: user

### Extended Memory Models (Defined, Not Currently Used)

- MemoryCategory, MemoryItem, MemoryActionsTaken, MemoryStrategy, MemoryAutomation, MemoryPainPoint, MemoryOpportunity, MemoryRoadmap

### Other Models

- **Knowledge** - User-uploaded knowledge files (defined, not actively used)
- **CoreFramework** - Business framework definitions (defined, not actively used)

---

## 🔌 BACKEND SYSTEMS

### 1. API Routes (`/app/api/**`)

#### Workflow Management (`/api/workflows/*`)
- **POST `/api/workflows/create`** - Create new workflow from JSON
- **GET `/api/workflows/list`** - List all workflows for user
- **GET `/api/workflows/[id]`** - Get workflow details
- **PUT `/api/workflows/update`** - Update workflow
- **DELETE `/api/workflows/delete`** - Delete workflow
- **POST `/api/workflows/activate`** - Deploy workflow to Pipedream and activate
- **POST `/api/workflows/run`** - Execute workflow manually
- **POST `/api/workflows/generate`** - AI-powered workflow generation from prompt
- **POST `/api/workflows/validate`** - Validate workflow structure
- **POST `/api/workflows/dry-run`** - Test workflow without execution
- **POST `/api/workflows/trigger`** - Trigger workflow (n8n integration, legacy)
- **GET `/api/workflows/sync-executions`** - Sync execution history from n8n (converted to Prisma)
- **POST `/api/workflows/build-from-template`** - Build workflow from template

#### Execution Management (`/api/executions/*`)
- **GET `/api/executions`** - List all executions (with filtering)
- **POST `/api/executions`** - Create execution record
- **PUT `/api/executions`** - Update execution
- **DELETE `/api/executions`** - Delete execution
- **GET `/api/executions/list`** - Alternative list endpoint
- **POST `/api/executions/log`** - Log execution result
- **GET `/api/executions/sync`** - Sync endpoint (placeholder)

#### Memory System (`/api/memory/*`)
- **GET `/api/memory`** - List memory entries
- **POST `/api/memory`** - Create memory entry
- **PUT `/api/memory`** - Update memory entry
- **DELETE `/api/memory`** - Delete memory entry
- **POST `/api/memory/create`** - Alternative create endpoint
- **PUT `/api/memory/update`** - Alternative update endpoint
- **DELETE `/api/memory/delete`** - Alternative delete endpoint
- **GET `/api/memory/list`** - Alternative list endpoint

#### Chat System (`/api/chat`)
- **GET `/api/chat`** - Get chat messages (with conversation_id filtering)
- **POST `/api/chat`** - Create chat message
- **PUT `/api/chat`** - Update chat message
- **DELETE `/api/chat`** - Delete chat message

#### Connections (`/api/connections`)
- **GET `/api/connections`** - List all connections
- **POST `/api/connections`** - Create connection
- **PUT `/api/connections`** - Update connection
- **DELETE `/api/connections`** - Delete connection

#### Users (`/api/users`)
- **GET `/api/users`** - List users
- **POST `/api/users`** - Create user
- **PUT `/api/users`** - Update user
- **DELETE `/api/users`** - Delete user
- **GET `/api/users/workflows`** - Get user workflows (placeholder)
- **GET `/api/users/executions`** - Get user executions (placeholder)
- **GET `/api/users/connections`** - Get user connections (placeholder)
- **GET `/api/users/memory`** - Get user memory (placeholder)

#### Brain/AI System (`/api/brain`)
- **POST `/api/brain`** - AI reasoning endpoint (placeholder for Claude integration)
  - Loads user memory
  - Prepares structured prompt
  - Returns JSON with reply, intent, memory_to_write, workflow_plan

#### Data Chain (`/api/data-chain`)
- **GET `/api/data-chain`** - Fetch complete user data chain (workflows, executions, connections, memory, chat)

#### Other Endpoints
- **POST `/api/activate-workflow`** - Legacy n8n activation (converted to Prisma)
- **GET `/api/test-n8n`** - Test n8n connection

---

### 2. Workflow Engine (`/lib/workflow/**`)

#### Core Components

**Types & Schema (`types.ts`, `schema.ts`)**
- `WorkflowPlan` - Core workflow structure
- `TriggerDefinition` - Webhook, Cron, Manual triggers
- `ActionDefinition` - HTTP Request, Set Data, Send Email, Delay actions
- Strict type system for workflow validation

**Validator (`validator.ts`)**
- Validates workflow structure
- Checks required fields
- Validates trigger and action types
- Returns structured validation results

**Builder (`builder.ts`)**
- Converts WorkflowPlan to execution engine format
- Handles workflow graph structure
- Maps actions to execution steps

**Connection Validator (`connectionValidator.ts`)**
- Validates user has required app connections
- Checks connection status
- Returns missing apps list

**Supported Apps (`supportedApps.ts`)**
- Defines which apps Synth can integrate with
- Currently minimal (email only)
- Extensible for future integrations

**Templates (`templates.ts`)**
- Workflow template system
- Pre-built workflow patterns

---

### 3. Execution Engines

#### Pipedream Integration (`/lib/pipedream/**`) - **PRIMARY (MVP)**

**Client (`pipedreamClient.ts`)**
- Full REST API client for Pipedream
- Functions:
  - `createWorkflow()` - Create workflow in Pipedream
  - `getWorkflow()` - Fetch workflow
  - `updateWorkflow()` - Update workflow
  - `deleteWorkflow()` - Delete workflow
  - `setWorkflowActive()` - Activate/deactivate
  - `executeWorkflow()` - Manual execution
  - `getExecution()` - Get execution details
- Error handling with `PipedreamAPIError` class
- Environment variable validation

**Deploy (`deployWorkflow.ts`)**
- Converts `WorkflowPlan` to Pipedream format
- Deploys to Pipedream API
- Returns deployment result with workflow ID

**Run (`runWorkflow.ts`)**
- Executes workflow in Pipedream
- Handles input data
- Returns execution result

#### n8n Integration (`/lib/n8n/**`) - **FUTURE (Not Used in MVP)**

**Client (`n8nClient.ts`)**
- Full REST API client for n8n
- Similar functions to Pipedream client
- Currently not used (MVP uses Pipedream only)

**Deploy (`deployWorkflow.ts`)**
- Converts workflow to n8n format
- Ready for future use

---

### 4. AI/LLM Integration (`/lib/ai/**`)

**Generate Workflow Plan (`generateWorkflowPlan.ts`)**
- AI-powered workflow generation
- Converts natural language to WorkflowPlan
- Integrates with Claude API (placeholder)

---

### 5. Memory System

**Storage**: Prisma `Memory` model
- Context types: preference, reasoning, pattern, workflow_decision, user_behavior
- JSON content storage
- Relevance scoring
- Last accessed tracking
- Metadata support

**Usage**:
- Loaded in Brain API for context
- Updated after workflow decisions
- Used for personalization

---

### 6. Knowledge Base (`/lib/knowledge/**`)

**Comprehensive Business Knowledge Library**:

#### Automation Knowledge
- `ai-reasoning-patterns.md` - AI reasoning strategies
- `api-fundamentals.md` - API integration patterns
- `automation-patterns.md` - Common automation patterns

#### Business Foundations
- `cognitive-biases.md` - Decision-making biases
- `competitive-advantage.md` - Business strategy
- `market-dynamics-basics.md` - Market analysis
- `value-creation.md` - Value proposition design
- `bottlenecks-constraints.md` - Systems thinking
- `systems-thinking.md` - Systems analysis

#### Finance
- `unit-economics.md` - Financial modeling
- `pricing-strategy.md` - Pricing frameworks

#### Management
- `decision-making.md` - Leadership decisions
- `hiring-basics.md` - Team building

#### Marketing
- `marketing-fundamentals.md` - Core marketing
- `content-strategy.md` - Content marketing
- `paid-ads-basics.md` - Paid advertising
- `offer-design.md` - Offer architecture

#### Operations
- `communication-systems.md` - Team communication
- `sop-design.md` - Process design
- `workflow-design.md` - Workflow engineering
- `error-handling.md` - Error management

#### Sales
- `lead-generation.md` - Lead gen strategies
- `qualification.md` - Lead qualification
- `appointment-setting.md` - Sales appointments
- `objection-handling.md` - Sales objections
- `sales-pipeline-management.md` - Pipeline ops

#### Strategy
- `five-forces.md` - Competitive analysis
- `go-to-market-strategy.md` - GTM planning
- `icp-definition.md` - Ideal customer profile
- `positioning.md` - Market positioning

#### Internal Architecture
- `synth-internal-architecture.md` - Complete system documentation

**Total**: 27+ knowledge files covering business automation, strategy, operations, and technical patterns

---

### 7. Environment & Configuration

**Environment Validator (`/lib/env/validator.ts`)**
- Validates required environment variables
- Throws errors if missing
- Used by Pipedream client

**Configuration Files**
- `prisma.ts` - Prisma client singleton
- `supabaseClient.ts` - Supabase client (legacy, not actively used)
- `supabaseServer.ts` - Supabase server client (legacy)

---

## 🎨 FRONTEND SYSTEMS

### 1. Pages (`/app/**`)

#### Main Pages
- **`/` (Home)** - Welcome page (placeholder)
- **`/dashboard`** - Main dashboard with SynthUpdatesCard
- **`/workflows`** - Workflow list page
  - Displays all workflows in grid
  - Shows active/inactive status
  - Links to workflow detail pages
- **`/workflows/create`** - Workflow creation page
  - JSON editor for manual workflow creation
  - AI prompt input for workflow generation
  - Template selection
  - Validation and error display
  - Connection validation feedback
- **`/workflows/[id]`** - Workflow detail page
  - Workflow metadata display
  - Trigger and actions JSON viewer
  - Run workflow button
  - Execution history
- **`/executions`** - Execution history page
  - Lists all executions
  - Shows workflow association
  - Expandable execution details

### 2. Components (`/components/**`)

#### UI Components (`/components/ui/`)
- **Badge** - Status badges (success, error, active, inactive)
- **Button** - Styled buttons with variants
- **Card** - Container component
- **Header** - Page header component
- **JsonEditor** - JSON editing component
- **Sidebar** - Navigation sidebar

#### Workflow Components (`/components/workflows/`)
- **WorkflowCard** - Workflow display card
- **RunWorkflowButton** - Button to execute workflow
- **ExecutionHistory** - Execution history display with expand/collapse

#### Execution Components (`/components/executions/`)
- **ExecutionRow** - Individual execution row with details

### 3. Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom Theme** - Dark theme with blue accents (`#194c92`)
- **Responsive Design** - Mobile-friendly layouts
- **Framer Motion** - Animation library (installed)

---

## 🔧 TECHNICAL STACK

### Core Technologies
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Prisma 6.19.0** - ORM for PostgreSQL
- **PostgreSQL (Neon)** - Database
- **Tailwind CSS 3.4.0** - Styling

### Key Libraries
- **@prisma/client** - Database client
- **@radix-ui** - UI component primitives (dialogs, dropdowns, etc.)
- **react-hook-form** - Form handling
- **zod** - Schema validation
- **lucide-react** - Icons
- **framer-motion** - Animations
- **sonner** - Toast notifications

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🚀 WORKFLOW SYSTEM DETAILS

### Workflow Lifecycle

1. **Creation**
   - User provides JSON or natural language prompt
   - System validates structure
   - Checks required connections
   - Stores in database

2. **Activation**
   - Converts WorkflowPlan to Pipedream format
   - Deploys to Pipedream API
   - Stores Pipedream workflow ID
   - Sets workflow to active

3. **Execution**
   - Manual trigger via API
   - Executes in Pipedream
   - Logs execution to database
   - Returns results

4. **Monitoring**
   - Execution history stored
   - Status tracking (success/failure/running)
   - Input/output data logging
   - Error handling

### Supported Triggers
- **Webhook** - HTTP webhook trigger
- **Cron** - Scheduled execution
- **Manual** - User-initiated execution

### Supported Actions
- **HTTP Request** - Make API calls
- **Set Data** - Data transformation
- **Send Email** - Email sending
- **Delay** - Wait/pause execution

### Workflow Validation
- Schema validation
- Connection validation
- Logic validation
- Safety checks

---

## 🔐 SECURITY & DATA

### Security Practices
- **No credentials in database** - Connection secrets stored securely elsewhere
- **User scoping** - All queries filtered by user_id
- **SYSTEM_USER_ID** - Temporary system user for MVP (will be replaced with auth)
- **Input validation** - All inputs validated before processing

### Data Storage
- **Neon PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database access
- **JSON fields** - Flexible data storage for triggers/actions
- **Relations** - Proper foreign keys and relationships

---

## 📝 CURRENT STATUS

### ✅ Fully Implemented
- Complete database schema with all required fields
- Full CRUD API for workflows, executions, connections, memory, chat, users
- Pipedream integration (deploy, run, manage workflows)
- Workflow validation system
- Connection validation
- Memory system (storage and retrieval)
- Chat message system
- Execution logging and history
- Frontend pages for workflows and executions
- UI components library
- Knowledge base (27+ files)

### 🚧 Partially Implemented
- **AI/Brain system** - Structure in place, Claude integration placeholder
- **Workflow generation** - Endpoint exists, needs full LLM integration
- **n8n integration** - Code ready but not used (MVP uses Pipedream)
- **User authentication** - Using SYSTEM_USER_ID placeholder

### 📋 Planned/Not Started
- Full user authentication system
- OAuth connection management UI
- Real-time execution monitoring
- Workflow templates UI
- Advanced memory categorization
- Knowledge base file uploads
- CoreFramework system usage

---

## 🎯 MVP FEATURES

### Core Functionality
1. ✅ Create workflows (JSON or AI-generated)
2. ✅ Deploy workflows to Pipedream
3. ✅ Execute workflows manually
4. ✅ View execution history
5. ✅ Manage connections (metadata)
6. ✅ Store and retrieve memory
7. ✅ Chat interface (basic)
8. ✅ Workflow validation

### Limitations (MVP)
- Single system user (no multi-user auth)
- Pipedream only (n8n not used)
- Basic app support (email only)
- Manual workflow creation primary
- AI generation placeholder

---

## 📚 DOCUMENTATION

### Knowledge Base Structure
- **Architecture** - System design docs
- **Schemas** - Data structure definitions
- **Reasoning** - AI behavior guidelines
- **Workflow Templates** - Template patterns
- **App Connections** - Integration guides

### Code Documentation
- Comprehensive TypeScript types
- Inline code comments
- Architecture documentation files
- API route documentation

---

## 🔄 DATA FLOW

### Workflow Creation Flow
```
User Input (JSON/Prompt)
  → Validation
  → Connection Check
  → Database Storage
  → Activation (Deploy to Pipedream)
  → Ready for Execution
```

### Execution Flow
```
User Triggers Workflow
  → Fetch from Database
  → Execute in Pipedream
  → Log Results to Database
  → Return to User
```

### Memory Flow
```
User Interaction
  → Brain API Processes
  → Memory Retrieved
  → Context Applied
  → New Memory Stored
  → Response Generated
```

---

## 🎨 UI/UX FEATURES

### Design System
- Dark theme
- Blue accent color (`#194c92`)
- Responsive grid layouts
- Card-based components
- Badge status indicators
- Expandable sections

### Navigation
- Sidebar navigation
- Active route highlighting
- Breadcrumb-style navigation

### User Feedback
- Error messages
- Loading states
- Success confirmations
- Validation feedback

---

## 🔮 FUTURE ROADMAP (Not Yet Implemented)

### Level 3 Features
- Multi-user authentication
- n8n integration activation
- Expanded app support (Gmail, Slack, etc.)
- Real-time execution monitoring
- Workflow versioning
- Advanced memory categorization
- Knowledge base file uploads
- Workflow sharing
- Template marketplace

---

**END OF OVERVIEW**

This document represents the complete state of Synth as of the latest audit. All systems are integrated and working with the Prisma schema.

