# Actions Schema

## What Are Actions?

Actions define the steps to execute in a workflow. They are the "what" of automation.

## Actions Structure

Actions are JSON-based and flexible.

**Format:** JSON array containing action objects

**Each Action Object Contains:**
- Action type
- Action configuration
- Parameters specific to the action type
- Data mappings from previous steps

## JSON-Based and Flexible

**Key Principle:** Actions are JSON-based, allowing new action types to be added without code changes.

**Benefits:**
- Extensible system
- Easy to add new action types
- Consistent structure across all actions
- Engine-agnostic definitions

## Action Sequencing

Actions are stored in an array and executed in order:

**Sequential Execution:**
- Action 1 runs first
- Action 2 runs after Action 1 completes
- Action 3 runs after Action 2 completes
- And so on...

**Data Flow:**
- Later actions can access data from earlier actions
- Actions can reference trigger data
- Data mappings are defined in each action's configuration

## Action Configuration

Each action includes:

**Type Identifier:** Specifies which kind of action this is
- Examples: send email, create record, post message, etc.

**App Identifier:** Which app this action uses
- Examples: Gmail, Slack, Airtable, etc.

**Parameters:** Configuration specific to the action type
- Input values
- Settings
- Options

**Data Mappings:** References to data from previous steps
- Trigger outputs
- Previous action outputs
- Static values

## Action Selection Process

When creating a workflow, Synth:

1. Analyzes user intent
2. Determines what actions are needed
3. Selects appropriate action types for each app
4. Orders actions logically
5. Configures parameters for each action
6. Defines data mappings between steps
7. Includes actions array in workflow JSON definition

## Validation

Before creating a workflow, action validation checks:

**Structural:**
- Is the actions array properly formatted?
- Are required fields present in each action?

**Logical:**
- Are actions in a sensible order?
- Do data mappings reference valid previous steps?
- Are there any circular dependencies?

**Capability:**
- Are all apps used in actions supported?
- Are all apps connected?
- Are the requested action types available?

## Cannot Offer Unavailable Actions

**Critical Rule:** Synth cannot offer actions using apps that are not connected.

**Validation Steps:**
1. Check if the app is in the supported apps list
2. Check if the user has connected that app
3. Only proceed if both conditions are met
4. Otherwise, prompt user to connect the app first

## Storage

Actions are stored as part of the workflow definition:
- **Location:** workflows table in Neon database
- **Field:** actions (JSON array field)
- **Access:** Via Prisma ORM

## Key Principles

**Flexible:** New action types can be added easily

**Ordered:** Actions execute sequentially

**Connected:** Actions can access data from previous steps

**Validated:** Checked before workflow creation

**Honest:** Only offer actions for connected apps

**Engine-Agnostic:** Works with Pipedream and future engines
