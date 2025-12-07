import { prisma } from "@/lib/prisma";

// Plan types aligned with pricing page and backend
// - free: No subscription (1 workflow, no execution)
// - starter: Starter plan - $49/mo (3 workflows)
// - growth: Growth plan (stored as "pro" in backend) - $149/mo (10 workflows)
// - scale: Scale plan (stored as "agency" in backend) - $399/mo (40 workflows)
export type PlanType = "free" | "starter" | "growth" | "scale";

export const FEATURES = {
  maxWorkflows: {
    free: 1,
    starter: 3,
    growth: 10,
    scale: 40,
  },
  allowWorkflowExecution: {
    free: false,
    starter: true,
    growth: true,
    scale: true,
  },
} as const;

/**
 * Determines the user's plan based on plan field.
 * Maps backend plan names to plan types:
 * - "starter" → "starter"
 * - "pro" → "growth" (Growth plan)
 * - "agency" → "scale" (Scale plan)
 * - null/undefined → "free"
 *
 * @param user - User object with plan field
 * @returns PlanType ("free" | "starter" | "growth" | "scale")
 */
export function getUserPlan(user: {
  plan?: string | null;
}): PlanType {
  const plan = user.plan?.toLowerCase() || "";

  // Map backend plan names to plan types
  if (plan.includes("starter")) {
    return "starter";
  }

  if (plan.includes("pro")) {
    return "growth";
  }

  if (plan.includes("agency")) {
    return "scale";
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
