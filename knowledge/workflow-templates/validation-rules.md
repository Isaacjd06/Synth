# Validation Rules

## Workflow Validation Requirements

All workflows must pass validation before being created and stored. This document defines the validation rules.

## Validation Phases

### Phase 1: Structural Validation

**Purpose:** Ensure workflow definition is properly formatted

**Checks:**

1. **JSON Structure**
   - Is the workflow definition valid JSON?
   - Are all required fields present?
   - Are field types correct?

2. **Trigger Validation**
   - Does trigger field exist?
   - Is trigger a valid JSON object?
   - Does trigger have a type specified?
   - Are trigger parameters present?

3. **Actions Validation**
   - Does actions field exist?
   - Is actions a valid JSON array?
   - Does array contain at least one action?
   - Is each action a valid JSON object?

4. **Intent Validation**
   - Does intent field exist?
   - Is intent a non-empty string?
   - Does intent describe the workflow purpose?

**Failure Response:** Reject workflow, explain structural issue

### Phase 2: Logical Validation

**Purpose:** Ensure workflow logic makes sense

**Checks:**

1. **Data Dependencies**
   - Can each action access required data?
   - Do data mappings reference valid previous steps?
   - Are there circular dependencies?
   - Is trigger data properly mapped?

2. **Action Sequencing**
   - Are actions in a sensible order?
   - Do dependent actions come after their dependencies?
   - Is the workflow flow logical?

3. **Trigger-Action Compatibility**
   - Do actions make sense with this trigger?
   - Is the workflow logically coherent?

4. **Required Parameters**
   - Are all required action parameters provided?
   - Are parameter values valid?
   - Are data types appropriate?

**Failure Response:** Explain logical issue, suggest corrections

### Phase 3: Capability Validation

**Purpose:** Ensure Synth can actually execute this workflow

**Checks:**

1. **App Support Validation**
   - For each app used in the workflow
   - Check if app is in supported apps list
   - If ANY app is unsupported → REJECT workflow

2. **Connection Validation**
   - For each supported app
   - Query connections table for this user
   - Check if connection status is "active"
   - If ANY required app is not connected → REJECT workflow

3. **Trigger Type Validation**
   - Is this trigger type supported?
   - Can Pipedream handle this trigger?
   - Are trigger parameters valid?

4. **Action Type Validation**
   - Is each action type supported?
   - Can Pipedream handle these actions?
   - Are action parameters valid?

**Failure Response:** List unsupported/unconnected apps, prompt user to connect

## Validation Rules

### Rule 1: All Apps Must Be Supported

**Validation:**
```
For each app in workflow:
  - Check if app exists in supported apps list
  - If NO → Validation FAILS
```

**Failure Action:**
- Do NOT create workflow
- Inform user which apps are not supported
- Suggest alternative supported apps if possible

### Rule 2: All Apps Must Be Connected

**Validation:**
```
For each app in workflow:
  - Query connections table
  - Filter by user_id and app_name
  - Check if status is "active"
  - If NO active connection → Validation FAILS
```

**Failure Action:**
- Do NOT create workflow
- List which apps need to be connected
- Provide connection instructions
- Wait for user to connect apps

### Rule 3: Workflow Logic Must Be Sound

**Validation:**
- Check for circular dependencies
- Verify data is available when needed
- Ensure action ordering makes sense
- Validate parameter completeness

**Failure Action:**
- Explain the logical issue
- Suggest corrections
- Work with user to fix

### Rule 4: JSON Must Be Valid

**Validation:**
- Parse JSON structure
- Check required fields
- Verify data types
- Ensure proper formatting

**Failure Action:**
- Explain structural issue
- Regenerate correct JSON
- Retry validation

### Rule 5: No Empty Workflows

**Validation:**
- Workflow must have at least one action
- Trigger must be defined
- Intent must be present

**Failure Action:**
- Request missing components from user
- Do not create incomplete workflow

## Validation Sequence

**Order of Validation (MUST follow this sequence):**

1. Structural Validation (JSON, fields, types)
2. Logical Validation (dependencies, ordering, coherence)
3. Capability Validation (support, connections, feasibility)

**Why This Order:**
- No point checking logic if structure is broken
- No point checking capabilities if logic is flawed
- Most efficient validation sequence

## When Validation Fails

**Step 1: Identify Issue**
- Which validation phase failed?
- What specific check failed?
- What's the root cause?

**Step 2: Communicate Clearly**
- Explain the issue to user in simple terms
- Don't use technical jargon
- Be specific about what's wrong

**Step 3: Provide Solution**
- If app not supported: Suggest alternatives
- If app not connected: Guide connection process
- If logic flawed: Explain correction needed
- If structure broken: Regenerate properly

**Step 4: Wait for Resolution**
- Do NOT proceed until issue is fixed
- Do NOT create partial workflows
- Do NOT skip validation steps

**Step 5: Re-validate**
- After user addresses issue
- Run validation again from the beginning
- Only proceed if all validations pass

## Validation Success

**When All Validations Pass:**

1. Confirm with user
2. Store workflow to Neon database
3. Save to workflows table via Prisma
4. Store reasoning in memory table
5. Prepare workflow for execution

## Key Validation Principles

**Complete:** Check everything, skip nothing

**Sequential:** Follow validation order strictly

**Blocking:** Failed validation prevents workflow creation

**Clear:** Explain failures in simple terms

**Helpful:** Provide solutions, not just errors

**Honest:** Don't promise what can't be delivered

**User-Friendly:** Guide users to fix issues

## Validation Enforcement

**ABSOLUTE RULE:** No workflow may be created without passing ALL validation checks.

This is non-negotiable for system reliability and user trust.
