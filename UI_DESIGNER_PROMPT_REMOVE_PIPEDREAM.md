# UI Designer Prompt: Remove All Pipedream References from User Interface

## Context
Synth uses Pipedream as the backend workflow engine, but this should be completely hidden from end users. The UI must present Synth as a self-contained automation platform with no external service branding or references.

## Objective
Remove ALL visible references to Pipedream, Pipedream IDs, or any indication that workflows are executed by an external service. Users should see Synth as the complete automation platform.

## Changes Already Made
The following changes have been completed:
1. ✅ Removed "Pipedream ID" display from workflow detail page (`app/(dashboard)/workflows/[id]/page.tsx`)
2. ✅ Removed "PD:" prefix from workflows table (`components/workflows/WorkflowsTable.tsx`)
3. ✅ Updated error messages in API routes to remove Pipedream references:
   - `app/api/workflows/trigger/route.ts` - "Failed to execute workflow" (was "Failed to execute workflow in Pipedream")
   - `app/api/workflows/generate/route.ts` - "Workflow created but failed to deploy" (was "failed to create in Pipedream")
   - `app/api/workflows/[id]/run/route.ts` - "Failed to run workflow" (was "Failed to run workflow in Pipedream")
   - `app/api/workflows/[id]/executions/route.ts` - "Failed to fetch executions" (was "Failed to fetch executions from Pipedream")
   - `app/api/workflows/activate/route.ts` - "Failed to deploy workflow" (was "Failed to deploy workflow to Pipedream")
   - `app/api/activate-workflow/route.ts` - "Failed to deploy workflow" (was "Failed to deploy workflow to Pipedream")
   - `app/api/connections/start/route.ts` - "Integration service not configured" (was "Pipedream API key not configured")
   - `app/api/connections/callback/route.ts` - "Integration service not configured" (was "Pipedream API key not configured")

## Remaining Tasks

### 1. Error Messages & User-Facing Text
**Location**: All API error responses and user-facing messages

**Action Required**:
- Review all error messages that mention "Pipedream", "pipedream", or "PD"
- Replace with generic messages like:
  - ❌ "Failed to execute workflow in Pipedream" 
  - ✅ "Failed to execute workflow"
  - ❌ "Pipedream API error"
  - ✅ "Workflow execution error"
  - ❌ "Pipedream API key not configured"
  - ✅ "Workflow engine configuration error"

**Files to Check**:
- `app/api/workflows/**/*.ts` - All workflow API routes
- `app/api/connections/**/*.ts` - Connection API routes
- Any toast notifications or error displays in components

### 2. Internal Field Names (If Exposed)
**Location**: Type definitions and component props

**Action Required**:
- Ensure `n8n_workflow_id` and `pipedream_execution_id` are NEVER displayed to users
- These are internal database fields and should remain hidden
- If any components expose these fields, remove the display entirely

**Files to Verify**:
- `components/workflows/WorkflowRunButton.tsx` - Uses `n8nWorkflowId` prop (internal only, OK)
- `components/executions/ExecutionRow.tsx` - Has `pipedream_execution_id` in type (internal only, OK)
- `components/executions/ExecutionsTable.tsx` - Has `pipedream_execution_id` in type (internal only, OK)

### 3. Connection/Integration UI
**Location**: Connection management pages and OAuth flows

**Action Required**:
- Remove any references to "Pipedream OAuth" or "Pipedream connections"
- Use generic terms like:
  - "Connect Service" instead of "Connect via Pipedream"
  - "Service Connection" instead of "Pipedream Connection"
  - "Integration" instead of "Pipedream Integration"

**Files to Check**:
- `app/(dashboard)/settings/connections/page.tsx` - Connections management UI
- `app/api/connections/start/route.ts` - OAuth flow initiation (error messages)
- `app/api/connections/callback/route.ts` - OAuth callback (error messages)

### 4. Developer Comments (If Visible)
**Location**: Code comments that might be exposed in error stack traces

**Action Required**:
- While code comments are typically not visible to users, ensure any error messages that might include stack traces don't expose Pipedream references
- Review error logging to ensure Pipedream references are only in server-side logs, not user-facing errors

### 5. Workflow Status & Metadata
**Location**: Workflow detail pages, execution history

**Action Required**:
- Ensure no workflow metadata displays internal IDs or service names
- Remove any "Engine" or "Provider" fields from workflow displays
- Keep workflow status generic: "Active", "Inactive", "Running", "Success", "Failed"

**Files to Verify**:
- `app/(dashboard)/workflows/[id]/page.tsx` - Already cleaned ✅
- `components/workflows/WorkflowExecutions.tsx` - Verify no internal IDs shown
- `components/workflows/ExecutionHistory.tsx` - Verify no internal IDs shown

### 6. Loading States & Placeholders
**Location**: Loading messages, placeholder text

**Action Required**:
- Review all loading messages and placeholders
- Replace any that mention external services
- Use generic terms like "Executing workflow..." instead of "Running in Pipedream..."

**Files to Check**:
- All components with loading states
- Toast notifications
- Error messages

## Design Principles

1. **Brand Consistency**: Synth should appear as a complete, self-contained platform
2. **User Experience**: Users should never need to know about backend infrastructure
3. **Error Handling**: Errors should be user-friendly and not expose technical details
4. **Transparency**: While hiding infrastructure, maintain clarity about what's happening (e.g., "Workflow is running" is clear; "Workflow is running in Pipedream" is not needed)

## Testing Checklist

After making changes, verify:
- [ ] No "Pipedream" text appears in any user-facing UI
- [ ] No "PD:" prefixes or abbreviations appear
- [ ] No internal IDs (n8n_workflow_id, pipedream_execution_id) are displayed
- [ ] Error messages are generic and user-friendly
- [ ] Loading states don't mention external services
- [ ] Connection flows use generic terminology
- [ ] Workflow metadata doesn't expose backend details

## Implementation Notes

- **Internal Code**: It's OK to keep Pipedream references in:
  - Server-side code (API routes)
  - Database field names (n8n_workflow_id, pipedream_execution_id)
  - Environment variables (PIPEDREAM_API_KEY)
  - Developer documentation (README.md)
  - Code comments (as long as they don't leak into user-facing errors)

- **User-Facing Code**: Must remove Pipedream references from:
  - All React components
  - All user-visible error messages
  - All toast notifications
  - All UI text and labels
  - All loading messages
  - All tooltips and help text

## Example Replacements

| Before | After |
|--------|-------|
| "Pipedream ID: abc123" | (Remove entirely) |
| "PD: abc123..." | (Remove entirely) |
| "Failed to execute in Pipedream" | "Failed to execute workflow" |
| "Pipedream API error" | "Workflow execution error" |
| "Connecting via Pipedream..." | "Connecting service..." |
| "Pipedream connection established" | "Service connected successfully" |

## Priority

**High Priority** (Visible to users):
- Error messages in API responses
- UI text and labels
- Toast notifications
- Loading messages

**Medium Priority** (May be visible):
- Connection flow messages
- Workflow metadata displays
- Status messages

**Low Priority** (Internal):
- Code comments
- Developer documentation
- Type definitions (as long as not exposed)

---

**Remember**: The goal is to make Synth appear as a complete, self-contained automation platform. Users should never see or need to know about Pipedream.

