# Data Flow

## How Data Moves Through Synth

This document describes how data flows through the Synth system from user input to workflow execution.

## The Complete Data Flow

### 1. User Input
**Source:** User provides natural language request

**Data:** Text describing what they want to automate

**Destination:** Synth AI Brain

### 2. Intent Processing
**Source:** Synth AI Brain

**Process:**
- Interprets user intent
- Plans workflow structure
- Selects triggers and actions

**Data Created:** Workflow definition (JSON format)

**Destination:** Neon database (workflows table)

### 3. Workflow Storage
**Source:** Workflow definition from Synth

**Storage Layer:** Prisma ORM

**Database:** Neon (PostgreSQL)

**Table:** workflows

**Data Stored:**
- Workflow ID
- User ID
- Trigger specification
- Actions array
- Intent description
- Metadata

### 4. Execution Request
**Trigger:** User requests workflow execution OR automated trigger fires

**Source:** Synth retrieves workflow from Neon

**Process:** Synth sends execution instructions to Pipedream

**Data Sent:**
- Workflow definition
- Execution parameters
- Required credentials/connections

**Destination:** Pipedream API

### 5. Workflow Execution
**Source:** Pipedream execution engine

**Process:**
- Pipedream processes the workflow
- Executes trigger logic
- Runs actions in sequence
- Calls third-party APIs

**Data Generated:** Execution results (success/failure, outputs, errors)

**Destination:** Return to Synth

### 6. Execution Logging
**Source:** Execution results from Pipedream

**Storage Layer:** Prisma ORM

**Database:** Neon

**Table:** executions

**Data Stored:**
- Execution ID
- Workflow ID
- Status (success/failure)
- Timestamp
- Results data
- Error logs (if any)

### 7. Context and Memory
**Ongoing Process:** Throughout the workflow lifecycle

**Source:** Synth AI Brain

**Tables Used:**
- `memory` - Long-term reasoning and context
- `chat_messages` - Conversation history for context reconstruction

**Purpose:** Maintain continuity and improve future workflow planning

## Database Tables and Data Flow

### users
**Data:** User identity information

**Used By:** All workflow and execution operations

**Updated:** User registration/profile changes

### workflows
**Data:** Workflow definitions

**Written By:** Synth after workflow planning

**Read By:** Synth when executing workflows

### executions
**Data:** Historical workflow runs

**Written By:** Synth after receiving results from Pipedream

**Read By:** Synth for analysis and reporting

### connections
**Data:** Metadata about app connections (NOT secrets)

**Written By:** Connection management system

**Read By:** Workflow validation logic

### memory
**Data:** Long-term user context and reasoning artifacts

**Written By:** Synth AI Brain during conversations

**Read By:** Synth when planning new workflows

### chat_messages
**Data:** Message logs for context reconstruction

**Written By:** Chat interface

**Read By:** Synth for understanding conversation history

## Prisma as ORM

All database interactions use Prisma:
- Type-safe database queries
- Schema management
- Migration handling
- Relationship management between tables

## Data Flow Summary

```
User Intent
    ↓
Synth AI Brain (interpret, plan, validate)
    ↓
Workflow JSON Definition
    ↓
Neon Database (via Prisma) - workflows table
    ↓
Synth sends to Pipedream API
    ↓
Pipedream executes workflow
    ↓
Results returned to Synth
    ↓
Neon Database (via Prisma) - executions table
    ↓
User sees results
```

## Key Principles

**Single Source of Truth:** Neon database stores all workflow definitions and execution history.

**ORM Layer:** Prisma provides type safety and schema management.

**Separation of Concerns:** Synth manages data, Pipedream manages execution.

**Audit Trail:** All executions are logged for history and debugging.

**Context Preservation:** Memory and chat tables maintain long-term context.
