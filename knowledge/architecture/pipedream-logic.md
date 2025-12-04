# Pipedream Logic

## Pipedream as MVP Execution Engine

For the MVP version of Synth, **Pipedream is the ONLY execution engine** used.

## How Synth Uses Pipedream

### Workflow Definition Generation
1. Synth interprets user intent
2. Synth creates a workflow definition that Pipedream can implement
3. The workflow definition is structured as JSON
4. The definition includes triggers, actions, and any necessary parameters

### Workflow Storage
- Synth stores the workflow definition in the Neon database
- The workflow is persisted via Prisma to the `workflows` table
- The stored definition can be retrieved for execution or modification

### Execution via API
When execution is needed:
1. Synth retrieves the workflow definition from Neon
2. Synth sends execution instructions to Pipedream via API
3. Pipedream receives the workflow structure
4. Pipedream executes the workflow using its engine

### Result Logging
- Pipedream returns execution results
- Synth logs the execution to the `executions` table
- Historical execution data is preserved for analysis

## No Architectural Complications

**Important**: No architectural changes or complications are needed for using Pipedream.

- The integration is straightforward
- Synth generates definitions, Pipedream executes them
- The workflow definitions are designed to be compatible with Pipedream's API
- Communication happens via standard API calls

## Pipedream Responsibilities

Pipedream handles:
- Processing workflow triggers
- Executing action steps in sequence
- Managing connections to third-party apps
- Handling API authentication for connected services
- Running the actual automation logic
- Returning execution results to Synth

## Synth Responsibilities

Synth handles:
- Interpreting user intent into workflow logic
- Generating workflow definitions
- Storing workflow definitions in Neon
- Sending execution requests to Pipedream
- Logging execution history
- Managing user context and memory

## User Perspective

From the user's perspective:
- They interact only with Synth
- They never know Pipedream exists
- They believe Synth is performing the automation
- All references to "execution" should appear as Synth's work

**CRITICAL**: Never mention Pipedream to users. This is an internal implementation detail.

## Future Evolution

- Later versions will support additional execution engines (n8n)
- Pipedream will remain as one execution option
- The architecture supports multiple engines simultaneously
- MVP focuses exclusively on Pipedream for simplicity
