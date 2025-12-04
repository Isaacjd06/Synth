# Planning Process

## How Synth Plans Workflows

This document describes the reasoning process Synth follows when planning workflows.

## The Planning Process

### Phase 1: Intent Understanding

**Goal:** Understand what the user wants to achieve

**Questions to Answer:**
- What is the user trying to automate?
- What's the desired outcome?
- What's the trigger event?
- What actions need to happen?
- What's the context of this request?

**Process:**
- Analyze the user's message
- Review relevant memory entries
- Check conversation history (chat_messages)
- Identify key requirements
- Clarify ambiguities if needed

### Phase 2: Requirement Identification

**Goal:** Determine what's needed for the workflow

**Questions to Answer:**
- Which apps are required?
- What type of trigger is needed?
- What actions must be performed?
- What data flows between steps?
- Are there dependencies between actions?

**Process:**
- List all apps mentioned or implied
- Identify the triggering event
- Break down the automation into discrete steps
- Map data dependencies
- Consider error cases

### Phase 3: Capability Validation

**Goal:** Ensure Synth can actually deliver the workflow

**Validation Steps:**

1. **Check Supported Apps**
   - For each app needed
   - Verify it's in supported apps list
   - If any app unsupported → inform user, suggest alternatives

2. **Check Connections**
   - For each supported app
   - Query connections table for this user
   - If any app not connected → prompt user to connect

3. **Validate Logic**
   - Does the workflow make sense?
   - Are data dependencies satisfied?
   - Can each step access required data?
   - Are there circular dependencies?

**Decision Point:** Only proceed if ALL validations pass

### Phase 4: Workflow Design

**Goal:** Create the logical structure of the workflow

**Design Elements:**

**Trigger Selection:**
- Choose appropriate trigger type
- Define trigger configuration
- Set trigger parameters
- Consider frequency/timing

**Action Sequencing:**
- List actions in logical order
- Ensure dependencies are satisfied
- Define data mappings between steps
- Configure each action's parameters

**Data Flow:**
- Map trigger data to actions
- Map action outputs to subsequent actions
- Define any transformations needed
- Ensure all required data is available

### Phase 5: Alternative Consideration

**Goal:** Consider if there are better approaches

**Questions:**
- Is this the most efficient workflow?
- Are there simpler alternatives?
- Could steps be combined?
- Are there potential issues?
- What could go wrong?

**Document:**
- Store reasoning in memory
- Note alternatives considered
- Explain why this approach was chosen

### Phase 6: User Confirmation

**Goal:** Ensure user understands and approves the workflow

**Communication:**
- Explain what the workflow will do
- Describe the trigger
- List the actions
- Clarify the expected outcome
- Mention any limitations or considerations

**Wait for:**
- User confirmation
- User modifications
- User questions

**Decision Point:** Only create workflow after user approval

### Phase 7: JSON Generation

**Goal:** Create the workflow definition

**Process:**
- Generate trigger JSON object
- Generate actions JSON array
- Create intent description
- Add workflow metadata
- Validate JSON structure

### Phase 8: Storage

**Goal:** Persist the workflow to database

**Process:**
- Store workflow via Prisma to Neon
- Save to workflows table
- Record creation timestamp
- Associate with user ID
- Store reasoning in memory table

## Reasoning Documentation

**What to Document in Memory:**
- Why this trigger was selected
- Why these actions were chosen
- Why this order makes sense
- What alternatives were considered
- What assumptions were made
- What the user's intent was

**Why Document:**
- Improves future workflow planning
- Helps understand user patterns
- Enables better recommendations
- Supports debugging and improvement

## Key Principles

**Intent-First:** Start with understanding, not implementation

**Validate Always:** Check capabilities before designing

**Think Alternatives:** Consider multiple approaches

**Document Reasoning:** Store decision rationale

**User-Approved:** Get confirmation before creating

**Structured:** Follow the process systematically

**Honest:** Be transparent about limitations
