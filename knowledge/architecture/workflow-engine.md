# Workflow Engine

## How Synth Builds Workflows

The workflow engine is the core intelligence of Synth. It transforms user intent into executable workflow definitions.

## Workflow Builder Logic

### Step 1: Intent Interpretation
- User provides a request in natural language
- Synth analyzes the intent to understand what the user wants to automate
- Key question: "What is the user trying to achieve?"

### Step 2: Workflow Planning
Synth plans the logical structure of the workflow:

**Planning Questions:**
- What should trigger this workflow?
- What actions need to happen?
- In what order should actions execute?
- What data flows between steps?
- What apps need to be involved?

**Planning Output:**
- A logical workflow structure
- Trigger specification
- Ordered list of actions
- Data dependencies between steps

### Step 3: Tool Selection
Synth selects appropriate triggers and actions:

**Trigger Selection:**
- Determine what event should start the workflow
- Choose the appropriate trigger type (webhook, schedule, app event, etc.)
- Define trigger parameters

**Action Selection:**
- Identify which apps and actions are needed
- Select specific actions for each step
- Determine parameters for each action

**Validation:**
- Verify that selected apps are supported
- Check that required apps are connected
- Ensure actions are compatible with available data

### Step 4: JSON Definition Creation
Synth generates a workflow definition in JSON format:

**JSON Structure Includes:**
- Workflow metadata (name, intent, etc.)
- Trigger specification
- Array of action steps
- Data mappings between steps
- Configuration parameters

**Flexibility:**
- Triggers and actions are JSON-based and flexible
- New trigger/action types can be added without changing core logic
- Definitions are engine-agnostic

### Step 5: Validation
Before storing the workflow, Synth validates:

**Structural Validation:**
- Is the JSON properly formatted?
- Are all required fields present?
- Are data types correct?

**Logical Validation:**
- Do the steps make logical sense?
- Is required data available at each step?
- Are there any circular dependencies?

**Capability Validation:**
- Are all apps in the workflow supported?
- Are all apps properly connected?
- Are the requested actions available?

### Step 6: Storage
- Valid workflow definitions are stored in Neon database
- Workflows are persisted via Prisma to the `workflows` table
- Each workflow receives a unique identifier

## Reasoning Documentation

The workflow engine must document its reasoning:

**What to Document:**
- Why a particular trigger was chosen
- Why specific actions were selected
- Why actions are ordered in a particular way
- What assumptions were made
- What alternative approaches were considered

**Where Reasoning is Stored:**
- Memory table for long-term context
- Workflow intent field for user-facing description
- Internal logs for debugging and improvement

## Key Principles

**Intent-Driven:** Start with what the user wants to achieve, not technical implementation.

**Validation-First:** Validate capabilities before making promises to users.

**Flexibility:** Support diverse workflow patterns through JSON-based definitions.

**Transparency:** Document reasoning for workflow decisions.

**Safety:** Never promise actions for unsupported or unconnected apps.
