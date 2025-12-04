# Multi-Step Templates

## Multi-Step Workflow Patterns

Multi-step workflows are more complex automations involving multiple actions, data transformations, and potentially multiple apps.

## Characteristics of Multi-Step Workflows

**Definition:** Workflows with multiple sequential actions that work together to accomplish a complex goal

**Attributes:**
- One trigger
- Four or more actions
- Sequential data flow through multiple steps
- Multiple apps involved
- Complex data transformations
- Clear intent describing the multi-step process

## Multi-Step Workflow Structure

### Basic Pattern

**Trigger:** Single event that starts the workflow

**Actions:** 4+ sequential actions that build on each other

**Data Flow:** Data passes through multiple steps, often being transformed

**Intent:** Clear description of the complete multi-step process

## Common Multi-Step Workflow Patterns

### Pattern 1: Data Enrichment Workflows

**Purpose:** Gather data from multiple sources and combine it

**Structure:**
- Trigger: Initial data event
- Action 1: Retrieve additional data from source A
- Action 2: Retrieve additional data from source B
- Action 3: Combine and format data
- Action 4: Store or send enriched data

**Example Use Case:**
- New lead created → Look up company info → Get contact details → Enrich CRM record → Notify sales team

### Pattern 2: Multi-App Synchronization

**Purpose:** Keep data synchronized across multiple apps

**Structure:**
- Trigger: Data updated in primary app
- Action 1: Format data for app B
- Action 2: Update app B
- Action 3: Format data for app C
- Action 4: Update app C
- Action 5: Log sync completion

**Example Use Case:**
- Contact updated in CRM → Update email platform → Update support system → Update analytics → Log sync

### Pattern 3: Processing Pipeline

**Purpose:** Process data through multiple transformation steps

**Structure:**
- Trigger: Data arrives
- Action 1: Validate data
- Action 2: Transform format
- Action 3: Enrich with additional info
- Action 4: Store processed data
- Action 5: Send notification

**Example Use Case:**
- Form submission → Validate fields → Format data → Look up user → Create record → Send confirmation

### Pattern 4: Multi-Channel Notifications

**Purpose:** Notify multiple stakeholders through different channels

**Structure:**
- Trigger: Important event occurs
- Action 1: Format message for channel A
- Action 2: Send to channel A
- Action 3: Format message for channel B
- Action 4: Send to channel B
- Action 5: Log notifications sent

**Example Use Case:**
- Critical alert → Format for Slack → Send Slack message → Format for email → Send email → Log to monitoring

## Multi-Step Workflow Planning

### When User Requests Multi-Step Workflow:

1. **Identify the complex goal**
   - What's the overall objective?
   - What are all the sub-tasks?

2. **Break down into discrete steps**
   - What needs to happen first?
   - What depends on what?
   - What's the logical sequence?

3. **Map data dependencies**
   - What data does each step need?
   - What data does each step produce?
   - How does data flow through the workflow?

4. **Identify all apps involved**
   - Which apps are needed for each step?
   - Are all apps supported?
   - Are all apps connected?

5. **Design the action sequence**
   - Order actions logically
   - Ensure dependencies are satisfied
   - Plan data transformations
   - Configure each action properly

## Data Flow in Multi-Step Workflows

### Data Dependencies

**Each action can access:**
- Data from the trigger
- Data from any previous action
- Static configuration values

**Data Mapping:**
- Action 1 uses trigger data
- Action 2 uses trigger + Action 1 output
- Action 3 uses trigger + Action 1 + Action 2 output
- And so on...

**Planning Considerations:**
- Ensure required data is available at each step
- Plan transformations when data format doesn't match
- Consider what to do if data is missing

## Validation for Multi-Step Workflows

### Check:
- Are all apps supported?
- Are all apps connected?
- Is action sequence logical?
- Are all data dependencies satisfied?
- Can each action access required data?
- Is there a circular dependency?
- Does intent describe the complete process?

### Complexity Verification:
- Is this genuinely multi-step or should it be simple?
- Are all steps necessary?
- Can any steps be combined?
- Is this the most efficient sequence?

## Benefits of Multi-Step Workflows

**Powerful:** Accomplish complex, sophisticated automations

**Flexible:** Handle diverse use cases

**Comprehensive:** Address multi-faceted business processes

**Efficient:** Automate entire processes, not just individual tasks

## When to Use Multi-Step Templates

**Use multi-step workflows when:**
- Goal requires multiple distinct actions
- Data needs transformation between steps
- Multiple apps must work together
- Process has clear sequential dependencies
- Simple workflow is insufficient

**Don't use multi-step when:**
- Simple workflow would suffice
- Unnecessary complexity is being added
- Steps could be separate workflows

## Creating Multi-Step Workflows

### Step 1: Understand Complete Intent
- What's the end-to-end goal?
- What are all the sub-goals?
- What's the complete process?

### Step 2: Identify All Requirements
- List all apps needed
- Identify all data points required
- Map out dependencies
- Determine action sequence

### Step 3: Validate All Capabilities
- Check all apps are supported
- Verify all apps are connected
- Ensure Synth can handle the complexity

### Step 4: Design Step-by-Step
- Plan each action carefully
- Map data flow precisely
- Configure parameters thoroughly
- Ensure logical sequence

### Step 5: Validate Workflow Logic
- Check data dependencies
- Verify action ordering
- Test for circular dependencies
- Ensure completeness

### Step 6: Generate Definition
- Create trigger JSON
- Create actions JSON array (4+ actions)
- Write comprehensive intent description
- Include all data mappings

### Step 7: Store and Execute
- Save to workflows table
- Send to Pipedream for execution
- Track execution carefully

## Multi-Step Workflow Documentation

**What to Store in Memory:**
- Why this multi-step approach was needed
- How data flows through the steps
- What dependencies exist between steps
- What alternatives were considered
- Why this sequence was chosen

**Documentation Importance:**
Multi-step workflows are complex. Thorough documentation helps with:
- Debugging issues
- Understanding failures
- Improving future workflows
- Learning user patterns

## Challenges with Multi-Step Workflows

**More Complexity:**
- More points of failure
- Harder to debug
- Requires more validation

**More Apps:**
- More connection requirements
- More potential for app issues

**More Data:**
- More data mapping required
- More transformation logic
- More potential for data mismatches

**Solutions:**
- Careful planning before creation
- Thorough validation at each step
- Clear documentation of logic
- Comprehensive error messaging

## Key Principles for Multi-Step Workflows

**Logical:** Actions follow clear, sensible sequence

**Complete:** All necessary steps included

**Efficient:** No unnecessary steps

**Dependent:** Each step properly accesses needed data

**Validated:** Thoroughly checked before creation

**Documented:** Reasoning clearly stored in memory

## Note on Template Specifics

The provided architecture does not specify exact template structures or specific workflow examples. This document outlines the conceptual framework for multi-step workflows. Specific templates should be added based on:
- Supported apps in the MVP
- Common complex use cases for target users
- Pipedream's capabilities for multi-step workflows
- Real user requests for sophisticated automations
