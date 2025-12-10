/**
 * Synth Subscription Plans Configuration
 * 
 * Defines all plan tiers, their limits, features, and pricing.
 */

export type PlanName = "starter" | "pro" | "agency";

export type IntegrationCategory = "basic" | "all" | "all+custom";
export type SupportTier = "email" | "priority" | "dedicated";
export type ExecutionRetention = "7_days" | "30_days" | "90_days";

export interface PlanLimits {
  // Workflow limits
  maxActiveWorkflows: number;
  
  // Execution limits
  maxMonthlyRuns: number;
  
  // Integration access
  allowedIntegrations: IntegrationCategory;
  
  // Support
  supportTier: SupportTier;
  
  // Execution history
  executionLogRetention: ExecutionRetention;
  
  // Feature flags
  customWebhooks: boolean;
  teamCollaboration: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;
}

export interface PlanConfig {
  name: PlanName;
  displayName: string;
  price: number; // Monthly price in USD
  priceId?: string; // Stripe price ID (set via env)
  limits: PlanLimits;
}

/**
 * Plan configurations for all three tiers
 */
export const PLANS: Record<PlanName, PlanConfig> = {
  starter: {
    name: "starter",
    displayName: "Starter Plan",
    price: 49,
    limits: {
      maxActiveWorkflows: 3,
      maxMonthlyRuns: 5000,
      allowedIntegrations: "basic",
      supportTier: "email",
      executionLogRetention: "7_days",
      customWebhooks: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
    },
  },
  pro: {
    name: "pro",
    displayName: "Pro Plan",
    price: 149,
    limits: {
      maxActiveWorkflows: 10,
      maxMonthlyRuns: 25000,
      allowedIntegrations: "all",
      supportTier: "priority",
      executionLogRetention: "30_days",
      customWebhooks: true,
      teamCollaboration: true,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
    },
  },
  agency: {
    name: "agency",
    displayName: "Agency Plan",
    price: 399,
    limits: {
      maxActiveWorkflows: 40,
      maxMonthlyRuns: 100000,
      allowedIntegrations: "all+custom",
      supportTier: "dedicated",
      executionLogRetention: "90_days",
      customWebhooks: true,
      teamCollaboration: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
    },
  },
};

/**
 * Get plan configuration by plan name
 */
export function getPlanConfig(planName: string | null | undefined): PlanConfig | null {
  if (!planName) return null;
  
  const normalized = planName.toLowerCase().trim();
  
  // Map common variations
  if (normalized.includes("starter")) {
    return PLANS.starter;
  }
  if (normalized.includes("pro") || normalized.includes("growth")) {
    return PLANS.pro;
  }
  if (normalized.includes("agency") || normalized.includes("scale") || normalized.includes("enterprise")) {
    return PLANS.agency;
  }
  
  // Direct match
  if (normalized === "starter") return PLANS.starter;
  if (normalized === "pro") return PLANS.pro;
  if (normalized === "agency") return PLANS.agency;
  
  return null;
}

/**
 * Get plan limits for a user
 * Returns null if user has no plan or plan is invalid
 */
export function getUserPlanLimits(planName: string | null | undefined): PlanLimits | null {
  const config = getPlanConfig(planName);
  return config?.limits || null;
}

/**
 * Check if a plan has a specific feature enabled
 */
export function hasPlanFeature(
  planName: string | null | undefined,
  feature: keyof PlanLimits,
): boolean {
  const limits = getUserPlanLimits(planName);
  if (!limits) return false;
  
  const value = limits[feature];
  return typeof value === "boolean" ? value : false;
}

/**
 * Get a plan limit value
 */
export function getPlanLimit(
  planName: string | null | undefined,
  limit: keyof PlanLimits,
): number | string | boolean | null {
  const limits = getUserPlanLimits(planName);
  if (!limits) return null;
  
  return limits[limit] ?? null;
}

/**
 * Check if an integration category is allowed for a plan
 */
export function isIntegrationAllowed(
  planName: string | null | undefined,
  integrationCategory: "basic" | "advanced" | "custom",
): boolean {
  const allowed = getPlanLimit(planName, "allowedIntegrations") as IntegrationCategory | null;
  
  if (!allowed) return false;
  
  if (allowed === "basic") {
    return integrationCategory === "basic";
  }
  
  if (allowed === "all") {
    return integrationCategory === "basic" || integrationCategory === "advanced";
  }
  
  if (allowed === "all+custom") {
    return true; // All categories including custom
  }
  
  return false;
}

/**
 * Get all plans as an array (useful for UI)
 */
export function getAllPlans(): PlanConfig[] {
  return [PLANS.starter, PLANS.pro, PLANS.agency];
}

/**
 * Compare plans to determine if one is an upgrade/downgrade
 */
export function comparePlans(plan1: PlanName | null, plan2: PlanName | null): "upgrade" | "downgrade" | "same" | null {
  if (!plan1 || !plan2) return null;
  if (plan1 === plan2) return "same";
  
  const order: PlanName[] = ["starter", "pro", "agency"];
  const index1 = order.indexOf(plan1);
  const index2 = order.indexOf(plan2);
  
  if (index1 === -1 || index2 === -1) return null;
  
  return index2 > index1 ? "upgrade" : "downgrade";
}

