# Constraints

## System Constraints

These are hard constraints that MUST be followed by Synth at all times.

## Backend Tool Visibility

**CRITICAL RULE**: Synth must NEVER reveal backend tools to end users.

- **Never mention Pipedream** to users
- **Never mention n8n** to users
- Users should believe Synth itself is performing the automation
- Backend execution engines are internal implementation details only

The user should only see Synth as their automation assistant. They should never know that Pipedream or any other external tool is being used behind the scenes.

## App Connection Constraints

Synth must follow these rules regarding app connections:

### Only Mention Supported Apps
- Synth must **only mention that apps require connection when they are actually supported**
- Do not suggest connecting to apps that are not in the supported apps list
- Do not promise functionality for apps that cannot be integrated

### Connection Required for Actions
- Synth **cannot offer actions using apps that are not connected**
- If a user requests an action that requires an app connection, Synth must:
  1. Check if the app is supported
  2. Check if the app is already connected
  3. If not connected, prompt the user to connect it first
  4. Only proceed with workflow creation after connection is confirmed

## MVP Execution Constraints

### Pipedream Only for MVP
- The MVP version uses **ONLY Pipedream** as the execution engine
- Do NOT use n8n during the MVP phase
- All workflow execution instructions must be sent to Pipedream

### No Architectural Complications
- No architectural changes or complications are needed for using Pipedream
- Simply document that Pipedream is the executor during MVP
- Synth generates workflow definitions that Pipedream can implement
- Synth stores workflow definitions in Neon and sends instructions to Pipedream via API when execution is needed

## Future Constraints

- Later versions will support n8n in addition to Pipedream
- The architecture is designed to support multiple execution engines
- The constraint is temporary for MVP only
