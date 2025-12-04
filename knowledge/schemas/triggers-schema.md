# Triggers Schema

## What Are Triggers?

Triggers define what event starts a workflow. They are the "when" of automation.

## Trigger Structure

Triggers are JSON-based and flexible.

**Format:** JSON object

**Core Components:**
- Trigger type
- Trigger configuration
- Parameters specific to the trigger type

## JSON-Based and Flexible

**Key Principle:** Triggers are JSON-based, allowing new trigger types to be added without code changes.

**Benefits:**
- Extensible system
- Easy to add new trigger types
- Consistent structure across all triggers
- Engine-agnostic definitions

## Common Trigger Types

While the provided architecture doesn't specify exact trigger types, the system supports various patterns:

### Webhooks
- Triggered by incoming HTTP requests
- Useful for external system integrations

### Schedules
- Triggered at specific times or intervals
- Useful for recurring tasks

### App Events
- Triggered by events in connected apps
- Examples: new email, new file, form submission

### Manual
- Triggered by user action
- Useful for on-demand workflows

## Trigger Configuration

Each trigger includes:

**Type Identifier:** Specifies which kind of trigger this is

**Parameters:** Configuration specific to the trigger type
- For schedules: time/interval settings
- For webhooks: URL and authentication
- For app events: which app and which event type

**Metadata:** Additional information about the trigger

## Trigger Selection Process

When creating a workflow, Synth:

1. Analyzes user intent
2. Determines what event should start the workflow
3. Selects appropriate trigger type
4. Configures trigger parameters
5. Includes trigger in workflow JSON definition

## Validation

Before creating a workflow, trigger validation checks:

**Structural:**
- Is the trigger JSON properly formatted?
- Are required fields present?

**Logical:**
- Is the trigger type supported?
- Are the parameters valid?

**Capability:**
- If the trigger requires an app, is that app connected?
- Is the trigger type available in the execution engine?

## Storage

Triggers are stored as part of the workflow definition:
- **Location:** workflows table in Neon database
- **Field:** trigger (JSON field)
- **Access:** Via Prisma ORM

## Key Principles

**Flexible:** New trigger types can be added easily

**Structured:** Consistent JSON format across all triggers

**Validated:** Checked before workflow creation

**Engine-Agnostic:** Works with Pipedream and future engines
