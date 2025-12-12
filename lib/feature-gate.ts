import { prisma } from "@/lib/prisma";
import {
  canCreateWorkflow,
  canExecuteWorkflow,
  getPlanWorkflowLimit,
  getPlanExecutionLimit,
  type SubscriptionPlan,
} from "@/lib/plan-enforcement";

/**
 * Get user's subscription plan from database
 */
export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription_plan: true },
  });

  if (!user || !user.subscription_plan) {
    return "free";
  }

  return user.subscription_plan as SubscriptionPlan;
}

/**
 * Checks if user has reached the maximum workflows limit.
 * Uses the new plan enforcement system.
 *
 * @param userId - User ID
 * @returns Object with allowed status, current count, and max allowed
 */
export async function checkWorkflowLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number | null;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription_plan: true },
  });

  if (!user) {
    return { allowed: false, currentCount: 0, maxAllowed: 0, reason: "User not found" };
  }

  const plan = (user.subscription_plan || "free") as SubscriptionPlan;
  const currentCount = await prisma.workflows.count({
    where: { user_id: userId },
  });

  const limitCheck = canCreateWorkflow(plan, currentCount);
  const maxAllowed = getPlanWorkflowLimit(plan);

  return {
    allowed: limitCheck.allowed,
    currentCount,
    maxAllowed,
    reason: limitCheck.reason,
  };
}

/**
 * Checks if user can execute workflows (monthly limit check).
 * Uses the new plan enforcement system.
 *
 * @param userId - User ID
 * @returns Object with allowed status and reason if not allowed
 */
export async function checkExecutionLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number | null;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription_plan: true },
  });

  if (!user) {
    return { allowed: false, currentCount: 0, maxAllowed: 0, reason: "User not found" };
  }

  const plan = (user.subscription_plan || "free") as SubscriptionPlan;
  
  // Count executions in current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentCount = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: {
        gte: startOfMonth,
      },
    },
  });

  const limitCheck = canExecuteWorkflow(plan, currentCount);
  const maxAllowed = getPlanExecutionLimit(plan);

  return {
    allowed: limitCheck.allowed,
    currentCount,
    maxAllowed,
    reason: limitCheck.reason,
  };
}
