# Plan Enforcement Usage Examples

This document shows how to use the plan enforcement system throughout the application.

## Basic Usage

### Check if user can create a workflow

```typescript
import { canCreateWorkflow } from "@/lib/plan-enforcement";

// In your API route or server action
const result = await canCreateWorkflow(userId);

if (!result.allowed) {
  return NextResponse.json(
    { 
      error: result.reason,
      upgradeRequired: result.upgradeRequired,
      currentValue: result.currentValue,
      limit: result.limit,
    },
    { status: 403 }
  );
}

// User can create workflow - proceed
```

### Check if user can run a workflow

```typescript
import { canRunWorkflow } from "@/lib/plan-enforcement";

const result = await canRunWorkflow(userId);

if (!result.allowed) {
  return NextResponse.json(
    { 
      error: result.reason,
      upgradeRequired: result.upgradeRequired,
      currentValue: result.currentValue,
      limit: result.limit,
    },
    { status: 403 }
  );
}

// User can run workflow - proceed
```

### Check if user can use an integration

```typescript
import { canUseIntegration } from "@/lib/plan-enforcement";

// Check for basic integration
const result = await canUseIntegration(userId, "basic");

// Check for advanced integration
const advancedResult = await canUseIntegration(userId, "advanced");

// Check for custom integration
const customResult = await canUseIntegration(userId, "custom");

if (!result.allowed) {
  return NextResponse.json(
    { 
      error: result.reason,
      upgradeRequired: result.upgradeRequired,
    },
    { status: 403 }
  );
}
```

### Check if user can use a feature

```typescript
import { canUseFeature } from "@/lib/plan-enforcement";

// Check for custom webhooks
const webhooksResult = await canUseFeature(userId, "customWebhooks");

// Check for API access
const apiResult = await canUseFeature(userId, "apiAccess");

// Check for white label
const whiteLabelResult = await canUseFeature(userId, "whiteLabel");

if (!result.allowed) {
  return NextResponse.json(
    { 
      error: result.reason,
      upgradeRequired: result.upgradeRequired,
    },
    { status: 403 }
  );
}
```

## Getting Plan Information

### Get user's plan limits summary

```typescript
import { getUserPlanSummary } from "@/lib/plan-enforcement";

const summary = await getUserPlanSummary(userId);

if (!summary) {
  // User has no plan
  return;
}

console.log(`Plan: ${summary.planName}`);
console.log(`Active Workflows: ${summary.limits.activeWorkflows.current}/${summary.limits.activeWorkflows.max}`);
console.log(`Monthly Runs: ${summary.limits.monthlyRuns.current}/${summary.limits.monthlyRuns.max}`);
console.log(`Has Custom Webhooks: ${summary.features.customWebhooks}`);
```

### Get plan configuration

```typescript
import { getPlanConfig, getUserPlanLimits } from "@/lib/plans";

// Get full plan config
const config = getPlanConfig(user.subscriptionPlan);
if (config) {
  console.log(`Plan: ${config.displayName}`);
  console.log(`Price: $${config.price}/month`);
  console.log(`Max Workflows: ${config.limits.maxActiveWorkflows}`);
}

// Get just the limits
const limits = getUserPlanLimits(user.subscriptionPlan);
if (limits) {
  console.log(`Max Monthly Runs: ${limits.maxMonthlyRuns}`);
  console.log(`Support Tier: ${limits.supportTier}`);
}
```

## Integration with API Routes

### Example: Creating a workflow

```typescript
// app/api/workflows/create/route.ts
import { authenticateUser } from "@/lib/auth-helpers";
import { canCreateWorkflow } from "@/lib/plan-enforcement";

export async function POST(req: Request) {
  const authResult = await authenticateUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { userId } = authResult;
  
  // Check if user can create workflow
  const canCreate = await canCreateWorkflow(userId);
  if (!canCreate.allowed) {
    return NextResponse.json(
      {
        error: canCreate.reason,
        upgradeRequired: canCreate.upgradeRequired,
        currentValue: canCreate.currentValue,
        limit: canCreate.limit,
      },
      { status: 403 }
    );
  }
  
  // Proceed with workflow creation
  // ...
}
```

### Example: Running a workflow

```typescript
// app/api/workflows/[id]/run/route.ts
import { authenticateUser } from "@/lib/auth-helpers";
import { canRunWorkflow } from "@/lib/plan-enforcement";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { userId } = authResult;
  
  // Check if user can run workflow
  const canRun = await canRunWorkflow(userId);
  if (!canRun.allowed) {
    return NextResponse.json(
      {
        error: canRun.reason,
        upgradeRequired: canRun.upgradeRequired,
        currentValue: canRun.currentValue,
        limit: canRun.limit,
      },
      { status: 403 }
    );
  }
  
  // Proceed with workflow execution
  // ...
}
```

## Frontend Usage

### Check plan limits before showing UI

```typescript
// components/workflows/WorkflowList.tsx
"use client";
import { useSession } from "next-auth/react";
import { getPlanConfig } from "@/lib/plans";

export function WorkflowList() {
  const { data: session } = useSession();
  const planConfig = getPlanConfig(session?.user?.plan);
  
  const maxWorkflows = planConfig?.limits.maxActiveWorkflows || 0;
  const currentWorkflows = workflows.length;
  const canCreateMore = currentWorkflows < maxWorkflows;
  
  return (
    <div>
      {canCreateMore ? (
        <Button onClick={createWorkflow}>Create Workflow</Button>
      ) : (
        <Button disabled>
          Limit Reached ({currentWorkflows}/{maxWorkflows})
        </Button>
      )}
    </div>
  );
}
```

## Plan Comparison

```typescript
import { comparePlans, getAllPlans } from "@/lib/plans";

// Compare two plans
const comparison = comparePlans("starter", "pro");
// Returns: "upgrade"

// Get all available plans
const plans = getAllPlans();
// Returns: [starterConfig, proConfig, agencyConfig]
```

