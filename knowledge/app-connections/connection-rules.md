# Connection Rules

## App Connection Constraints

These rules govern how Synth handles app connections and must be followed strictly.

## Rule 1: Only Mention Supported Apps

**Constraint:** Synth must only mention that apps require connection when they are actually supported.

**What This Means:**
- Do NOT suggest connecting to apps that are not in the supported apps list
- Do NOT promise functionality for apps that cannot be integrated
- Only recommend apps that Synth can actually work with

**Why:**
- Prevents user disappointment
- Maintains trust
- Avoids false promises

## Rule 2: Connection Required for Actions

**Constraint:** Synth cannot offer actions using apps that are not connected.

**Process When User Requests an Action:**

1. **Check if app is supported**
   - Is the app in the supported apps list?
   - If NO: Inform user the app is not currently supported

2. **Check if app is connected**
   - Query the connections table for this user and app
   - Check connection status

3. **If not connected**
   - Prompt the user to connect the app first
   - Do NOT proceed with workflow creation
   - Explain that the app needs to be connected

4. **If connected**
   - Proceed with workflow planning
   - Include actions for the connected app

## Rule 3: Validate Before Workflow Creation

**Before creating any workflow:**

**Check ALL apps used in the workflow:**
- For each app in the planned workflow
- Verify it's in supported apps list
- Verify the user has connected it
- If ANY app fails these checks, do NOT create the workflow

**Inform the User:**
- List which apps need to be connected
- Provide clear instructions on what to do next
- Wait for confirmation that apps are connected before proceeding

## Rule 4: Connections Table Metadata Only

**Important:** The connections table stores metadata about connections, but NOT secrets themselves.

**What's Stored:**
- App name
- Connection status (active/inactive)
- Connection type (OAuth, API key, etc.)
- Timestamps

**What's NOT Stored:**
- OAuth tokens (stored securely elsewhere)
- API keys (stored securely elsewhere)
- Passwords
- Any sensitive secrets

## Rule 5: Check Connection Status

**When to Check:**
- Before suggesting workflows that use an app
- Before creating workflows
- When user asks about capabilities

**How to Check:**
- Query connections table
- Filter by user ID and app name
- Check status field

## Rule 6: Never Promise Unsupported Apps

**Constraint:** Do not suggest workflows using apps that aren't supported, even if the user requests them.

**Response When User Requests Unsupported App:**
- Acknowledge the request
- Explain the app is not currently supported
- Suggest alternative supported apps if applicable
- Do NOT create a workflow using the unsupported app

## Workflow Example

**User Request:** "Create a workflow that sends Slack messages when I get Gmail emails"

**Synth Process:**
1. Check if Gmail is supported → YES
2. Check if user connected Gmail → If NO, prompt to connect
3. Check if Slack is supported → YES
4. Check if user connected Slack → If NO, prompt to connect
5. If both connected → Proceed with workflow creation
6. If either not connected → List what needs to be connected first

## Key Principles

**Honest:** Only offer what's actually available

**Validated:** Always check before promising

**User-First:** Clear communication about connection requirements

**Secure:** Metadata only in connections table, secrets elsewhere

**Reliable:** Never create workflows with missing connections
