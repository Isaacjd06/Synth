/**
 * Client-safe entitlement utilities
 * 
 * These utilities don't import Prisma and can be safely used in client components
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

export type PlanName = keyof typeof PLAN_ENTITLEMENTS;

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
  
  if (normalized === "starter") {
    return PLAN_ENTITLEMENTS.starter;
  }
  
  if (normalized === "pro") {
    return PLAN_ENTITLEMENTS.pro;
  }
  
  if (normalized === "agency") {
    return PLAN_ENTITLEMENTS.agency;
  }
  
  return null;
}

/**
 * Check if a plan has a specific entitlement
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
 * Check if user can perform an action based on their plan and subscription status
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

