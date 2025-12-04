# Simple Templates

## Simple Workflow Patterns

Simple workflows are single-trigger, single or few-action automations that accomplish straightforward tasks.

## Characteristics of Simple Workflows

**Definition:** Workflows with minimal complexity and clear, direct purpose

**Attributes:**
- One trigger
- One to three actions
- Linear flow (no branching)
- Single app or two apps maximum
- Clear, simple intent
- Easy to understand and explain

## Simple Workflow Structure

### Basic Pattern

**Trigger:** Single event that starts the workflow

**Actions:** 1-3 sequential actions

**Data Flow:** Simple, direct data passing from trigger to actions

**Intent:** Clear, single-purpose description

## Common Simple Workflow Patterns

### Pattern 1: Notification Workflows

**Purpose:** Send notifications when something happens

**Structure:**
- Trigger: Event occurs in one app
- Action: Send notification to another app

**Example Use Case:**
- When new email arrives → Send Slack message
- When form submitted → Send email notification

### Pattern 2: Data Logging Workflows

**Purpose:** Log events or data to a tracking system

**Structure:**
- Trigger: Event occurs
- Action: Create record in logging app

**Example Use Case:**
- When task completed → Log to spreadsheet
- When payment received → Record in database

### Pattern 3: Simple Data Transfer

**Purpose:** Move data from one app to another

**Structure:**
- Trigger: Data created in source app
- Action: Create corresponding data in target app

**Example Use Case:**
- When contact added → Create CRM record
- When file uploaded → Save to cloud storage

### Pattern 4: Scheduled Actions

**Purpose:** Perform recurring actions on a schedule

**Structure:**
- Trigger: Time-based schedule
- Action: Perform specific task

**Example Use Case:**
- Daily at 9am → Send summary email
- Weekly on Monday → Generate report

## Simple Workflow Planning

### When User Requests Simple Workflow:

1. **Identify the single main goal**
   - What one thing should this accomplish?

2. **Determine the trigger**
   - What event starts this?
   - Is it time-based or event-based?

3. **Select minimal actions**
   - What's the fewest actions needed?
   - Can this be done in one or two steps?

4. **Keep it straightforward**
   - Avoid unnecessary complexity
   - Don't add extra features
   - Focus on the core need

## Validation for Simple Workflows

### Check:
- Is the workflow actually simple, or should it be multi-step?
- Are all apps supported and connected?
- Is the trigger appropriate?
- Are actions in correct order?
- Does the intent clearly describe the workflow?

### Simplicity Test:
- Can you explain this workflow in one sentence?
- If YES → It's appropriately simple
- If NO → Consider if it should be multi-step

## Benefits of Simple Workflows

**Easy to Understand:** Users grasp them immediately

**Quick to Create:** Minimal planning required

**Reliable:** Fewer steps mean fewer failure points

**Good Starting Point:** Users can understand automation basics

**Fast Execution:** Minimal steps mean quick completion

## When to Use Simple Templates

**Use simple workflows when:**
- User's goal is straightforward
- Only one or two apps needed
- Linear flow with no conditions
- Quick, single-purpose automation
- User is new to automation

**Don't force simple workflows when:**
- Task actually requires multiple steps
- Complex data transformations needed
- Multiple conditions or branches required
- Better suited for multi-step template

## Creating Simple Workflows

### Step 1: Understand Intent
- What's the single goal?
- What triggers this?
- What's the one outcome?

### Step 2: Validate Capabilities
- Are required apps supported?
- Are apps connected?

### Step 3: Design Minimally
- Fewest actions possible
- Simplest data flow
- No unnecessary steps

### Step 4: Generate Definition
- Create trigger JSON
- Create actions JSON (1-3 actions max)
- Write clear intent description

### Step 5: Store and Execute
- Save to workflows table
- Send to Pipedream for execution

## Simple Workflow Documentation

**What to Store in Memory:**
- Why this simple approach was chosen
- What alternatives were considered
- User's intent in simple terms

## Key Principles for Simple Workflows

**Minimal:** Fewest steps necessary

**Clear:** Easy to understand purpose

**Direct:** Straight path from trigger to outcome

**Focused:** Single purpose, not multi-purpose

**Appropriate:** Actually simple, not oversimplified

## Note on Template Specifics

The provided architecture does not specify exact template structures or specific workflow examples. This document outlines the conceptual framework for simple workflows. Specific templates should be added based on:
- Supported apps in the MVP
- Common use cases for target users
- Pipedream's capabilities
- Real user requests
