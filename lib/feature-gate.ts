import { prisma } from "@/lib/prisma";

export const FEATURES = {
  maxWorkflows: {
    free: 1,
    pro: 50,
  },
  allowWorkflowExecution: {
    free: false,
    pro: true,
  },
} as const;

/**
 * Determines the user's plan based on plan field.
 * Returns "pro" if plan contains "pro" (case-insensitive), otherwise "free".
 *
 * @param user - User object with plan field
 * @returns "free" | "pro"
 */
export function getUserPlan(user: {
  plan?: string | null;
}): "free" | "pro" {
  const plan = user.plan?.toLowerCase() || "";

  // Check if plan contains "pro" (handles "pro", "pro_monthly", "pro_yearly", etc.)
  if (plan.includes("pro")) {
    return "pro";
  }

  return "free";
}

/**
 * Checks if a feature is allowed for a user.
 *
 * @param user - User object with plan field
 * @param feature - Feature name (e.g., "maxWorkflows", "allowWorkflowExecution")
 * @returns true if feature is allowed, false otherwise
 */
export function checkFeature(
  user: { plan?: string | null },
  feature: keyof typeof FEATURES,
): boolean {
  const plan = getUserPlan(user);
  const featureConfig = FEATURES[feature];

  if (typeof featureConfig === "object" && plan in featureConfig) {
    return featureConfig[plan as keyof typeof featureConfig] as boolean;
  }

  return false;
}

/**
 * Gets the feature limit value for a user.
 *
 * @param user - User object with plan field
 * @param feature - Feature name (e.g., "maxWorkflows")
 * @returns The limit value for the user's plan
 */
export function getFeatureLimit(
  user: { plan?: string | null },
  feature: keyof typeof FEATURES,
): number {
  const plan = getUserPlan(user);
  const featureConfig = FEATURES[feature];

  if (typeof featureConfig === "object" && plan in featureConfig) {
    return featureConfig[plan as keyof typeof featureConfig] as number;
  }

  return 0;
}

/**
 * Checks if user has reached the maximum workflows limit.
 *
 * @param userId - User ID
 * @returns true if user has reached the limit, false otherwise
 */
export async function checkWorkflowLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    return { allowed: false, currentCount: 0, maxAllowed: 0 };
  }

  const maxAllowed = getFeatureLimit(user, "maxWorkflows");
  const currentCount = await prisma.workflows.count({
    where: { user_id: userId },
  });

  return {
    allowed: currentCount < maxAllowed,
    currentCount,
    maxAllowed,
  };
}
