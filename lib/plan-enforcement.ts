/**
 * Plan Enforcement System
 * 
 * Enforces subscription plan limits and restrictions throughout the application.
 */

import { prisma } from "@/lib/prisma";
import { getPlanConfig, getUserPlanLimits, type PlanName } from "@/lib/plans";
import { hasFullAccess } from "@/lib/access-control";

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  currentValue?: number;
  limit?: number;
  upgradeRequired?: PlanName;
}

/**
 * Check if user can create a new workflow
 */
export async function canCreateWorkflow(userId: string): Promise<EnforcementResult> {
  // First check if user has active subscription
  const hasAccess = await hasFullAccess(userId);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: "Active subscription required to create workflows",
    };
  }

  // Get user's plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
    };
  }

  const planConfig = getPlanConfig(user.subscriptionPlan);
  if (!planConfig) {
    return {
      allowed: false,
      reason: "Invalid subscription plan",
    };
  }

  // Count active workflows
  const activeWorkflowsCount = await prisma.workflows.count({
    where: {
      user_id: userId,
      active: true,
    },
  });

  const maxWorkflows = planConfig.limits.maxActiveWorkflows;

  if (activeWorkflowsCount >= maxWorkflows) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${maxWorkflows} active workflows`,
      currentValue: activeWorkflowsCount,
      limit: maxWorkflows,
      upgradeRequired: getUpgradePlan(planConfig.name, "maxActiveWorkflows"),
    };
  }

  return {
    allowed: true,
    currentValue: activeWorkflowsCount,
    limit: maxWorkflows,
  };
}

/**
 * Check if user can run a workflow (within monthly run limit)
 */
export async function canRunWorkflow(userId: string): Promise<EnforcementResult> {
  // First check if user has active subscription
  const hasAccess = await hasFullAccess(userId);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: "Active subscription required to run workflows",
    };
  }

  // Get user's plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
    };
  }

  const planConfig = getPlanConfig(user.subscriptionPlan);
  if (!planConfig) {
    return {
      allowed: false,
      reason: "Invalid subscription plan",
    };
  }

  // Count runs this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const runsThisMonth = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: {
        gte: startOfMonth,
      },
    },
  });

  const maxRuns = planConfig.limits.maxMonthlyRuns;

  if (runsThisMonth >= maxRuns) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${maxRuns.toLocaleString()} workflow runs`,
      currentValue: runsThisMonth,
      limit: maxRuns,
      upgradeRequired: getUpgradePlan(planConfig.name, "maxMonthlyRuns"),
    };
  }

  return {
    allowed: true,
    currentValue: runsThisMonth,
    limit: maxRuns,
  };
}

/**
 * Check if user can use a specific integration
 */
export async function canUseIntegration(
  userId: string,
  integrationCategory: "basic" | "advanced" | "custom",
): Promise<EnforcementResult> {
  // First check if user has active subscription
  const hasAccess = await hasFullAccess(userId);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: "Active subscription required to use integrations",
    };
  }

  // Get user's plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
    };
  }

  const planConfig = getPlanConfig(user.subscriptionPlan);
  if (!planConfig) {
    return {
      allowed: false,
      reason: "Invalid subscription plan",
    };
  }

  const allowed = planConfig.limits.allowedIntegrations;

  // Check based on integration category
  if (integrationCategory === "basic") {
    // All plans allow basic integrations
    return { allowed: true };
  }

  if (integrationCategory === "advanced") {
    if (allowed === "basic") {
      return {
        allowed: false,
        reason: "Advanced integrations require Pro plan or higher",
        upgradeRequired: "pro",
      };
    }
    return { allowed: true };
  }

  if (integrationCategory === "custom") {
    if (allowed !== "all+custom") {
      return {
        allowed: false,
        reason: "Custom integrations require Agency plan",
        upgradeRequired: "agency",
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown integration category" };
}

/**
 * Check if user can use a specific feature
 */
export async function canUseFeature(
  userId: string,
  feature: "customWebhooks" | "teamCollaboration" | "whiteLabel" | "apiAccess" | "customIntegrations",
): Promise<EnforcementResult> {
  // First check if user has active subscription
  const hasAccess = await hasFullAccess(userId);
  if (!hasAccess) {
    return {
      allowed: false,
      reason: "Active subscription required",
    };
  }

  // Get user's plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) {
    return {
      allowed: false,
      reason: "User not found",
    };
  }

  const planConfig = getPlanConfig(user.subscriptionPlan);
  if (!planConfig) {
    return {
      allowed: false,
      reason: "Invalid subscription plan",
    };
  }

  const hasFeature = planConfig.limits[feature];

  if (!hasFeature) {
    // Determine which plan has this feature
    let requiredPlan: PlanName = "pro";
    if (feature === "whiteLabel" || feature === "apiAccess" || feature === "customIntegrations") {
      requiredPlan = "agency";
    }

    return {
      allowed: false,
      reason: `${feature} requires ${requiredPlan === "agency" ? "Agency" : "Pro"} plan`,
      upgradeRequired: requiredPlan,
    };
  }

  return { allowed: true };
}

/**
 * Get user's current plan limits summary
 */
export async function getUserPlanSummary(userId: string): Promise<{
  planName: string | null;
  limits: {
    activeWorkflows: { current: number; max: number };
    monthlyRuns: { current: number; max: number; resetDate: Date };
    integrations: string;
    support: string;
    retention: string;
  };
  features: {
    customWebhooks: boolean;
    teamCollaboration: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  if (!user) return null;

  const planConfig = getPlanConfig(user.subscriptionPlan);
  if (!planConfig) return null;

  // Get current usage
  const activeWorkflows = await prisma.workflows.count({
    where: { user_id: userId, active: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const monthlyRuns = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: { gte: startOfMonth },
    },
  });

  return {
    planName: planConfig.displayName,
    limits: {
      activeWorkflows: {
        current: activeWorkflows,
        max: planConfig.limits.maxActiveWorkflows,
      },
      monthlyRuns: {
        current: monthlyRuns,
        max: planConfig.limits.maxMonthlyRuns,
        resetDate: nextMonth,
      },
      integrations: planConfig.limits.allowedIntegrations,
      support: planConfig.limits.supportTier,
      retention: planConfig.limits.executionLogRetention,
    },
    features: {
      customWebhooks: planConfig.limits.customWebhooks,
      teamCollaboration: planConfig.limits.teamCollaboration,
      whiteLabel: planConfig.limits.whiteLabel,
      apiAccess: planConfig.limits.apiAccess,
      customIntegrations: planConfig.limits.customIntegrations,
    },
  };
}

/**
 * Helper to determine which plan to upgrade to for a specific limit
 */
function getUpgradePlan(currentPlan: PlanName, limit: string): PlanName {
  if (currentPlan === "starter") {
    return "pro";
  }
  if (currentPlan === "pro") {
    return "agency";
  }
  return "agency"; // Already at highest tier
}

