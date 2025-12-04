# Execution Model

## How Workflow Execution Works

Synth follows a clear separation between workflow intelligence and workflow execution.

## The Execution Process

### Step 1: Workflow Definition Creation
- Synth interprets user intent
- Synth generates a workflow definition in JSON format
- The definition includes:
  - Trigger specification
  - Action steps
  - User intent description

### Step 2: Workflow Storage
- Synth stores the workflow definition in the Neon database
- The workflow is saved to the `workflows` table via Prisma
- Each workflow has a unique identifier

### Step 3: Execution Trigger
When a workflow needs to run:
- Synth sends execution instructions to Pipedream via API
- The instructions include the workflow definition
- Pipedream receives the workflow structure and parameters

### Step 4: Actual Execution
- **Pipedream handles the actual execution** of workflows for MVP
- Pipedream processes the trigger
- Pipedream executes the defined actions in sequence
- Pipedream manages API calls to third-party services

### Step 5: Execution Logging
- Execution results are logged back to Synth
- Historical runs are stored in the `executions` table
- Each execution record includes:
  - Workflow ID
  - Execution status
  - Timestamp
  - Results or error data

## Key Separation

**Intelligence Layer (Synth)**:
- Interprets intent
- Designs workflows
- Stores definitions
- Tracks execution history
- Manages user context

**Execution Layer (Pipedream)**:
- Runs the actual workflow
- Manages triggers
- Executes actions
- Calls third-party APIs
- Returns results

## Why This Model?

This separation allows:
- Synth to focus on AI-driven workflow planning
- External engines to handle the complexity of execution
- Multiple execution engines to be supported (future: n8n)
- Workflow definitions to remain engine-agnostic

## Synth Does NOT Execute

It is critical to understand: **Synth does NOT execute workflows directly.**

Synth is the brain that plans and instructs. The execution engine (Pipedream) is the body that performs the work.
