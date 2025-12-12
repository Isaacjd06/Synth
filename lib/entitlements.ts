/**
 * Centralized Entitlement Engine for Synth
 * 
 * Defines all plan capabilities and provides utilities to check entitlements
 * across both backend and frontend. This is the single source of truth for
 * what each subscription plan can and cannot do.
 * 
 * Usage:
 * - Backend: Check entitlements before allowing actions
 * - Frontend: Show/hide features, enable/disable buttons based on entitlements
 */

import type { SubscriptionPlan } from "./subscription-client";

/**
 * Plan entitlement definitions
 * Each plan has specific capabilities and limits
 */
export const PLAN_ENTITLEMENTS = {
  starter: {
    maxActiveWorkflows: 3,
    maxRunsPerMonth: 5000,
    integrations: "basic" as const,
    logRetentionDays: 7,
    customWebhooks: false,
    teamCollaboration: false,
    whiteLabel: false,
    apiAccess: false,
    customIntegrations: false,
  },
  pro: {
    maxActiveWorkflows: 10,
    maxRunsPerMonth: 25000,
    integrations: "all" as const,
    logRetentionDays: 30,
    customWebhooks: true,
    teamCollaboration: true,
    whiteLabel: false,
    apiAccess: false,
    customIntegrations: false,
  },
  agency: {
    maxActiveWorkflows: 40,
    maxRunsPerMonth: 100000,
    integrations: "all" as const,
    logRetentionDays: 90,
    customWebhooks: true,
    teamCollaboration: true,
    whiteLabel: true,
    apiAccess: true,
    customIntegrations: true,
  },
} as const;

/**
 * Type for plan names
 */
export type PlanName = keyof typeof PLAN_ENTITLEMENTS;

/**
 * Type for entitlement values
 */
export type EntitlementValue = 
  | number 
  | boolean 
  | "basic" 
  | "all";

/**
 * Get entitlements for a specific plan
 * Returns null if plan is invalid or user has no plan
 */
export function getPlanEntitlements(
  plan: SubscriptionPlan | string | null | undefined
): typeof PLAN_ENTITLEMENTS.starter | null {
  if (!plan) return null;
  
  const normalized = typeof plan === "string" 
    ? plan.toLowerCase().trim() 
    : plan;
  
  // Map plan variations
  if (normalized === "none" || normalized === "") return null;
  if (normalized.includes("starter") || normalized === "starter") {
    return PLAN_ENTITLEMENTS.starter;
  }
  if (normalized.includes("pro") || normalized.includes("growth") || normalized === "pro") {
    return PLAN_ENTITLEMENTS.pro;
  }
  if (normalized.includes("agency") || normalized.includes("scale") || normalized.includes("enterprise") || normalized === "agency") {
    return PLAN_ENTITLEMENTS.agency;
  }
  
  return null;
}

/**
 * Check if a plan has a specific boolean entitlement
 * 
 * @param plan - User's plan name
 * @param entitlement - Name of the entitlement to check
 * @returns true if the plan has this entitlement enabled
 */
export function hasEntitlement(
  plan: SubscriptionPlan | string | null | undefined,
  entitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): boolean {
  const entitlements = getPlanEntitlements(plan);
  if (!entitlements) return false;
  
  const value = entitlements[entitlement];
  return typeof value === "boolean" ? value : false;
}

/**
 * Get a numeric entitlement value (e.g., maxActiveWorkflows, maxRunsPerMonth)
 * 
 * @param plan - User's plan name
 * @param entitlement - Name of the entitlement to get
 * @returns The numeric value, or 0 if not found or plan is invalid
 */
export function getEntitlementValue(
  plan: SubscriptionPlan | string | null | undefined,
  entitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): number {
  const entitlements = getPlanEntitlements(plan);
  if (!entitlements) return 0;
  
  const value = entitlements[entitlement];
  return typeof value === "number" ? value : 0;
}

/**
 * Check if a plan's integration level allows a specific integration category
 * 
 * @param plan - User's plan name
 * @param category - Integration category to check ("basic" | "advanced" | "custom")
 * @returns true if the plan allows this integration category
 */
export function canUseIntegration(
  plan: SubscriptionPlan | string | null | undefined,
  category: "basic" | "advanced" | "custom"
): boolean {
  const entitlements = getPlanEntitlements(plan);
  if (!entitlements) return false;
  
  const integrationLevel = entitlements.integrations;
  
  if (category === "basic") {
    // All plans with any integration access can use basic integrations
    return integrationLevel === "basic" || integrationLevel === "all";
  }
  
  if (category === "advanced") {
    // Only plans with "all" integrations can use advanced
    return integrationLevel === "all";
  }
  
  if (category === "custom") {
    // Only plans with custom integrations enabled can use custom
    return entitlements.customIntegrations === true;
  }
  
  return false;
}

/**
 * Check if user can perform an action based on their plan
 * This is a convenience function that combines plan check with entitlement check
 * 
 * @param plan - User's plan name
 * @param requiredEntitlement - The entitlement required for this action
 * @returns true if user's plan has the required entitlement
 */
export function canPerformAction(
  plan: SubscriptionPlan | string | null | undefined,
  requiredEntitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): boolean {
  // No plan = no access
  if (!plan || plan === "none") return false;
  
  return hasEntitlement(plan, requiredEntitlement);
}

/**
 * Get all entitlements as a flat object for easy access
 * Useful for displaying plan features in UI
 * 
 * @param plan - User's plan name
 * @returns Object with all entitlements, or null if plan is invalid
 */
export function getAllEntitlements(
  plan: SubscriptionPlan | string | null | undefined
): typeof PLAN_ENTITLEMENTS.starter | null {
  return getPlanEntitlements(plan);
}

/**
 * Compare two plans to determine upgrade/downgrade path
 * 
 * @param currentPlan - User's current plan
 * @param targetPlan - Plan to compare against
 * @returns "upgrade", "downgrade", "same", or null if invalid
 */
export function comparePlans(
  currentPlan: SubscriptionPlan | string | null | undefined,
  targetPlan: SubscriptionPlan | string | null | undefined
): "upgrade" | "downgrade" | "same" | null {
  if (!currentPlan || !targetPlan) return null;
  if (currentPlan === targetPlan) return "same";
  
  const planOrder: PlanName[] = ["starter", "pro", "agency"];
  
  const current = getPlanEntitlements(currentPlan);
  const target = getPlanEntitlements(targetPlan);
  
  if (!current || !target) return null;
  
  const currentIndex = planOrder.findIndex(
    name => PLAN_ENTITLEMENTS[name] === current
  );
  const targetIndex = planOrder.findIndex(
    name => PLAN_ENTITLEMENTS[name] === target
  );
  
  if (currentIndex === -1 || targetIndex === -1) return null;
  
  return targetIndex > currentIndex ? "upgrade" : "downgrade";
}

/**
 * Get the minimum plan required for a specific entitlement
 * Useful for showing "Upgrade to Pro" messages
 * 
 * @param entitlement - The entitlement to check
 * @returns The minimum plan name that has this entitlement, or null
 */
export function getMinimumPlanForEntitlement(
  entitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): PlanName | null {
  // Check each plan in order
  for (const planName of ["starter", "pro", "agency"] as PlanName[]) {
    const entitlements = PLAN_ENTITLEMENTS[planName];
    const value = entitlements[entitlement];
    
    // For boolean entitlements, return first plan that has it
    if (typeof value === "boolean" && value === true) {
      return planName;
    }
    
    // For numeric entitlements, return starter (all have some value)
    if (typeof value === "number" && value > 0) {
      return "starter";
    }
    
    // For integration levels, check appropriately
    if (entitlement === "integrations") {
      if (value === "all") return "pro";
      if (value === "basic") return "starter";
    }
  }
  
  return null;
}

/**
 * Check if user has access based on both subscription status and plan
 * This ensures the user is both subscribed AND has the required plan
 * 
 * @param subscriptionStatus - User's subscription status ("SUBSCRIBED" | "UNSUBSCRIBED")
 * @param plan - User's plan name
 * @param requiredEntitlement - The entitlement required
 * @returns true if user has active subscription AND the required entitlement
 */
export function hasAccess(
  subscriptionStatus: "SUBSCRIBED" | "UNSUBSCRIBED" | string | null | undefined,
  plan: SubscriptionPlan | string | null | undefined,
  requiredEntitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): boolean {
  // Must be subscribed
  if (!subscriptionStatus || subscriptionStatus !== "SUBSCRIBED") {
    return false;
  }
  
  // Must have the required entitlement
  return hasEntitlement(plan, requiredEntitlement);
}

/**
 * Get user's current entitlements based on their subscription state
 * Combines subscription status check with plan entitlements
 * 
 * @param subscriptionStatus - User's subscription status
 * @param plan - User's plan name
 * @returns Entitlements object if user is subscribed, null otherwise
 */
export function getUserEntitlements(
  subscriptionStatus: "SUBSCRIBED" | "UNSUBSCRIBED" | string | null | undefined,
  plan: SubscriptionPlan | string | null | undefined
): typeof PLAN_ENTITLEMENTS.starter | null {
  // Must be subscribed to have entitlements
  if (!subscriptionStatus || subscriptionStatus !== "SUBSCRIBED") {
    return null;
  }
  
  return getPlanEntitlements(plan);
}

/**
 * Check if user can exceed a limit (e.g., workflow count, execution count)
 * Useful for backend validation before allowing actions
 * 
 * @param subscriptionStatus - User's subscription status
 * @param plan - User's plan name
 * @param entitlementKey - The entitlement key to check (e.g., "maxActiveWorkflows")
 * @param currentUsage - Current usage count
 * @returns true if user can perform the action (hasn't exceeded limit)
 */
export function canExceedLimit(
  subscriptionStatus: "SUBSCRIBED" | "UNSUBSCRIBED" | string | null | undefined,
  plan: SubscriptionPlan | string | null | undefined,
  entitlementKey: "maxActiveWorkflows" | "maxRunsPerMonth",
  currentUsage: number
): boolean {
  // Must be subscribed
  if (!subscriptionStatus || subscriptionStatus !== "SUBSCRIBED") {
    return false;
  }
  
  const limit = getEntitlementValue(plan, entitlementKey);
  return currentUsage < limit;
}

/**
 * Backend helper: Get user entitlements from database
 * Fetches user's subscription status and plan, then returns their entitlements
 * 
 * @param userId - User ID
 * @returns Entitlements object if user is subscribed, null otherwise
 */
export async function getUserEntitlementsFromDb(userId: string): Promise<typeof PLAN_ENTITLEMENTS.starter | null> {
  const { prisma } = await import("@/lib/prisma");
  const { SubscriptionStatus } = await import("@prisma/client");
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscription_plan: true,
    },
  });
  
  if (!user) {
    return null;
  }
  
  return getUserEntitlements(user.subscriptionStatus, user.subscription_plan);
}

/**
 * Backend helper: Check if user has a specific entitlement
 * Fetches user data and checks entitlement in one call
 * 
 * @param userId - User ID
 * @param entitlement - The entitlement to check
 * @returns true if user has the entitlement
 */
export async function userHasEntitlement(
  userId: string,
  entitlement: keyof typeof PLAN_ENTITLEMENTS.starter
): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const { SubscriptionStatus } = await import("@prisma/client");
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscription_plan: true,
    },
  });
  
  if (!user) {
    return false;
  }
  
  return hasAccess(user.subscriptionStatus, user.subscription_plan, entitlement);
}

