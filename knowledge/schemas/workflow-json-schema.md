# Workflow JSON Schema

## Workflow Definition Structure

All workflows created by Synth are stored as JSON objects. This document describes the structure of workflow definitions.

## Core Workflow JSON Structure

A workflow definition consists of three main components:

### 1. Trigger Specification
**Purpose:** Defines what event starts the workflow

**Format:** JSON object

**Contains:**
- Trigger type (webhook, schedule, app event, manual, etc.)
- Trigger configuration
- Parameters specific to the trigger type

### 2. Actions Array
**Purpose:** Defines the sequence of steps to execute

**Format:** JSON array

**Contains:**
- Ordered list of action objects
- Each action has a type and configuration
- Data mappings between steps

### 3. Intent Description
**Purpose:** Human-readable explanation of what the workflow does

**Format:** String

**Contains:**
- User-facing description of the workflow's purpose
- What the workflow accomplishes
- Why it was created

## JSON-Based and Flexible

**Key Principle:** Triggers and actions are JSON-based and flexible.

**Benefits:**
- New trigger types can be added without code changes
- New action types can be added without code changes
- Workflow definitions are engine-agnostic
- Easy to store, retrieve, and modify

**Flexibility:**
- The schema can evolve over time
- Custom fields can be added for specific needs
- Extensible without breaking existing workflows

## Workflow Metadata

In addition to trigger, actions, and intent, workflows include:

**Identification:**
- Workflow ID
- Workflow name
- User ID

**Status:**
- Active/inactive flag
- Created timestamp
- Updated timestamp

**Configuration:**
- Execution settings
- Error handling preferences
- Notification settings

## Engine-Agnostic Design

Workflow definitions are designed to be engine-agnostic:

**What This Means:**
- The same JSON structure can be sent to different execution engines
- Pipedream receives workflow definitions in this format
- Future engines (like n8n) will also receive this format
- Synth doesn't need to change workflow structure when switching engines

## Data Flow Between Steps

Actions in the workflow can reference data from previous steps:

**Data Mapping:**
- Actions can access trigger data
- Actions can access outputs from previous actions
- Data references are included in the action configuration
- Pipedream handles the actual data passing during execution

## Validation

Before storing, workflow JSON is validated:

**Structural Validation:**
- Required fields are present
- Data types are correct
- JSON is properly formatted

**Logical Validation:**
- Actions reference valid previous steps
- Required app connections exist
- Workflow logic is sound

## Storage

Valid workflow JSON is stored in:
- **Database:** Neon
- **Table:** workflows
- **ORM:** Prisma
- **Format:** JSON fields within the database row

## Key Principles

**Structured:** Clear, consistent format for all workflows

**Flexible:** Can evolve without breaking existing workflows

**Readable:** Intent field makes purpose clear to humans

**Executable:** Contains all information needed for execution

**Engine-Agnostic:** Works with multiple execution engines
