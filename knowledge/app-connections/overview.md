# Overview

## App Connections in Synth

App connections enable Synth to create workflows that interact with third-party applications.

## What Are App Connections?

**Definition:** An app connection is an authenticated link between a user's Synth account and a third-party service.

**Purpose:**
- Allow workflows to access user's data in apps
- Enable actions on connected apps
- Provide secure authentication for API calls

## How Connections Work

### User Connects an App
1. User initiates connection to an app (e.g., Gmail, Slack)
2. User completes authentication (OAuth or API key)
3. Connection metadata is stored in connections table
4. Secrets are stored securely (NOT in connections table)
5. Connection status set to "active"

### Synth Uses the Connection
1. User requests a workflow that needs the app
2. Synth checks if the app is connected
3. If connected, Synth includes actions for that app
4. Workflow is sent to Pipedream for execution
5. Pipedream uses the secure connection to perform actions

## Connections Table

**What's Stored:**
- Connection metadata (NOT secrets)
- App name
- Connection status
- Connection type
- Timestamps

**What's NOT Stored:**
- OAuth tokens
- API keys
- Passwords
- Secrets

Secrets are stored securely in a separate secure storage system.

## Connection Validation

Before creating workflows, Synth validates:

1. **Is the app supported?**
   - Check against supported apps list

2. **Is the app connected?**
   - Query connections table
   - Check connection status

3. **Is the connection active?**
   - Verify status is "active"

## Connection Requirements for Workflows

**Rule:** Workflows can ONLY use connected apps.

**Process:**
- User requests workflow
- Synth identifies which apps are needed
- Synth checks if all required apps are connected
- If any app is NOT connected, prompt user to connect it first
- Only create workflow when all apps are connected

## User Experience

**User Perspective:**
- Users must connect apps before using them in workflows
- Connection is a one-time setup per app
- Once connected, app is available for all workflows
- Users can disconnect apps at any time

**Synth Behavior:**
- Only suggest supported apps
- Check connections before promising workflows
- Clear communication about connection requirements
- Guide users through connection process when needed

## Security

**Secure Storage:**
- Secrets stored in secure storage (not Neon database)
- Connections table only stores metadata
- Tokens and keys never exposed to users
- Secure transmission between Synth and execution engine

## Key Principles

**Supported Apps Only:** Only mention apps that are actually supported

**Connection Required:** Cannot create workflows with unconnected apps

**Metadata in Database:** Connections table stores metadata, not secrets

**User-Controlled:** Users decide which apps to connect

**Validated:** Always check connection status before workflow creation
