# Database Schema

## Neon Database Structure

Synth uses a Neon (PostgreSQL) database with Prisma as the ORM.

## Six Main Tables

The database consists of six core tables that support all of Synth's functionality.

### 1. users

**Purpose:** Basic user identity

**Contains:**
- User ID (primary key)
- Email
- Name
- Authentication information
- Account metadata

**Used For:**
- User authentication
- Associating workflows with users
- Tracking user-specific data

**Relationships:**
- One user has many workflows
- One user has many executions
- One user has many connections
- One user has many memory entries
- One user has many chat messages

### 2. workflows

**Purpose:** Stores workflow definitions

**Contains:**
- Workflow ID (primary key)
- User ID (foreign key)
- Workflow name
- **Trigger specification** (JSON)
- **Actions array** (JSON)
- **Intent description** (text explaining what the workflow does)
- Status (active/inactive)
- Created timestamp
- Updated timestamp
- Metadata

**Key Fields:**
- `trigger`: JSON field containing the trigger configuration
- `actions`: JSON array containing the sequence of actions
- `intent`: User-facing description of what the workflow accomplishes

**Used For:**
- Storing workflow definitions created by Synth
- Retrieving workflows for execution
- Managing user's automation library

**Relationships:**
- Belongs to one user
- Has many executions

### 3. executions

**Purpose:** Logs historical runs of workflows

**Contains:**
- Execution ID (primary key)
- Workflow ID (foreign key)
- User ID (foreign key)
- Status (success/failure/running)
- Start timestamp
- End timestamp
- Results data (JSON)
- Error logs (if any)
- Execution metadata

**Used For:**
- Tracking workflow execution history
- Debugging failed workflows
- Analyzing workflow performance
- Providing execution reports to users

**Relationships:**
- Belongs to one workflow
- Belongs to one user

### 4. connections

**Purpose:** Stores metadata about app connections

**IMPORTANT:** This table stores metadata about connections, but **NOT secrets themselves**.

**Contains:**
- Connection ID (primary key)
- User ID (foreign key)
- App name (e.g., "Gmail", "Slack")
- Connection status (active/inactive)
- Connection type (OAuth, API key, etc.)
- Created timestamp
- Last verified timestamp
- Metadata

**Does NOT Contain:**
- OAuth tokens (stored securely elsewhere)
- API keys (stored securely elsewhere)
- Passwords
- Secrets

**Used For:**
- Checking if a user has connected a specific app
- Validating workflow requirements before creation
- Managing user's app connection status

**Relationships:**
- Belongs to one user

### 5. memory

**Purpose:** Stores long-term user context and reasoning artifacts

**Contains:**
- Memory ID (primary key)
- User ID (foreign key)
- Context type (preference, reasoning, pattern, etc.)
- Content (text or JSON)
- Relevance score
- Created timestamp
- Last accessed timestamp
- Metadata

**Used For:**
- Maintaining long-term user preferences
- Storing reasoning about past workflows
- Learning user patterns over time
- Improving future workflow planning
- Context for conversations

**Relationships:**
- Belongs to one user

### 6. chat_messages

**Purpose:** Logs messages for context reconstruction

**Contains:**
- Message ID (primary key)
- User ID (foreign key)
- Role (user/assistant/system)
- Content (message text)
- Timestamp
- Conversation ID (for grouping related messages)
- Metadata

**Used For:**
- Reconstructing conversation context
- Understanding user request history
- Maintaining conversation continuity
- Debugging user interactions

**Relationships:**
- Belongs to one user

## Prisma ORM

All database interactions use Prisma:

**Benefits:**
- Type-safe database queries
- Automatic schema management
- Migration handling
- Relationship enforcement
- Query optimization

**Schema Management:**
- Database schema defined in Prisma schema file
- Migrations generated and applied via Prisma CLI
- Type definitions auto-generated for TypeScript

## Database Principles

**Single Source of Truth:** All workflow data lives in Neon.

**No Secrets in Database:** Connection secrets are stored securely outside the main database (Prisma handles secret management separately or delegates to secure storage).

**Audit Trail:** Executions table provides complete history.

**Context Preservation:** Memory and chat_messages enable long-term learning.

**Relational Integrity:** Foreign keys and Prisma relationships ensure data consistency.
