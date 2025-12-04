# n8n Logic

## n8n Status: Future Support Only

**IMPORTANT**: n8n is NOT used in the MVP version of Synth.

## MVP Constraint

- The MVP uses **ONLY Pipedream** as the execution engine
- n8n is NOT implemented during MVP
- Do NOT use n8n during the MVP phase
- All execution goes through Pipedream

## Future Support

n8n will be supported in later versions of Synth as an alternative execution engine.

### Planned Architecture
When n8n is implemented:
- Synth will support multiple execution engines simultaneously
- Users may be able to choose between Pipedream and n8n
- Workflow definitions will remain engine-agnostic
- The same workflow definition format can be sent to either engine

### Why n8n Later?

- n8n is a planned future addition
- The architecture is designed to support multiple engines
- Pipedream is sufficient for MVP validation
- n8n will provide additional flexibility and options

## Current State

- n8n integration: NOT IMPLEMENTED
- n8n API calls: NOT CONFIGURED
- n8n workflow execution: NOT AVAILABLE
- n8n documentation: PLACEHOLDER FOR FUTURE

## When n8n is Added

Future documentation will include:
- How Synth generates n8n-compatible workflow definitions
- How Synth communicates with n8n API
- How n8n executes workflows
- How execution results are logged back to Synth
- Engine selection logic (Pipedream vs n8n)

## Developer Note

If you are reading this during MVP development:
- Ignore all n8n references
- Focus exclusively on Pipedream
- Do not build n8n integrations
- Do not design for n8n compatibility yet

The n8n integration will be addressed in a post-MVP phase.

## User Communication

**CRITICAL**: Never mention n8n to users, just like Pipedream.

Both are internal implementation details and should remain invisible to end users.
