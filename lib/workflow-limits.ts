/**
 * Workflow Execution Limits
 * 
 * Checks if users can run workflows based on their subscription plan limits.
 */

import { prisma } from "@/lib/prisma";
import { getEffectiveSubscriptionPlan } from "./subscription";
import { getEntitlementValue } from "./entitlements";
import type { SubscriptionPlan } from "./subscription-client";

/**
 * Check if user can run a workflow based on their plan limits
 * 
 * @param userId - User ID
 * @returns Error message if limit exceeded, null if allowed
 */
export async function checkWorkflowRunLimit(userId: string): Promise<string | null> {
  // Get user's effective plan (considering trial periods)
  const plan = await getEffectiveSubscriptionPlan(userId);

  // FREE plan cannot run workflows
  if (plan === "free" || plan === "none") {
    return "Workflow execution is not available on the FREE plan. Please upgrade to STARTER or higher to run workflows.";
  }

  // Get the user's execution limit for their plan
  const maxRunsPerMonth = getEntitlementValue(plan, "maxRunsPerMonth");

  // If no limit (shouldn't happen, but handle gracefully)
  if (maxRunsPerMonth === 0) {
    return null; // Unlimited
  }

  // Count executions in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const executionCount = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Check if user has exceeded their limit
  if (executionCount >= maxRunsPerMonth) {
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    return `You have reached your monthly execution limit (${maxRunsPerMonth} runs) for the ${planName} plan. Please upgrade to increase your limit or wait until next month.`;
  }

  return null; // Allowed
}

/**
 * Get user's current execution usage for the current billing period
 * 
 * @param userId - User ID
 * @returns Object with current usage and limit
 */
export async function getExecutionUsage(userId: string): Promise<{
  current: number;
  limit: number;
  plan: SubscriptionPlan;
}> {
  const plan = await getEffectiveSubscriptionPlan(userId);
  const limit = getEntitlementValue(plan, "maxRunsPerMonth");

  // Count executions in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const current = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: {
        gte: thirtyDaysAgo,
      },
    },
  });

  return {
    current,
    limit,
    plan,
  };
}

