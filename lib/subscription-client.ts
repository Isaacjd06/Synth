/**
 * Client-safe subscription utilities
 * 
 * These utilities don't import Prisma and can be safely used in client components
 */

export type SubscriptionPlan = "free" | "starter" | "pro" | "agency";

export interface SubscriptionUsage {
  activeWorkflowsUsed?: number;
  activeWorkflowsLimit?: number;
  executionsUsed?: number;
  executionsLimit?: number;
  logRetentionDays?: number;
}

export interface SubscriptionState {
  plan: SubscriptionPlan;
  isSubscribed: boolean; // plan !== "free"
  isTrial?: boolean;
  renewalDate?: string | null;
  billingCycle?: "monthly" | "yearly" | null;
  usage?: SubscriptionUsage;
}

/**
 * Map backend plan name to SubscriptionPlan type
 */
export function mapPlanToSubscriptionPlan(plan: string | null | undefined): SubscriptionPlan {
  if (!plan) return "free";
  
  const normalized = plan.toLowerCase().trim();
  
  if (normalized === "free" || normalized === "none" || normalized === "inactive") return "free";
  if (normalized.includes("starter")) return "starter";
  if (normalized.includes("pro") || normalized.includes("growth")) return "pro";
  if (normalized.includes("agency") || normalized.includes("scale")) return "agency";
  
  return "free";
}

/**
 * Get log retention days for a plan
 */
export function getLogRetentionDays(plan: SubscriptionPlan): number {
  switch (plan) {
    case "starter":
      return 7;
    case "pro":
      return 30;
    case "agency":
      return 90;
    case "free":
    default:
      return 0;
  }
}

/**
 * Get display name for a plan
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "agency":
      return "Agency";
    case "free":
    default:
      return "Free";
  }
}

/**
 * Get color classes for plan badge
 */
export function getPlanBadgeColors(plan: SubscriptionPlan): {
  bg: string;
  text: string;
  border: string;
} {
  switch (plan) {
    case "starter":
      return {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
      };
    case "pro":
      return {
        bg: "bg-primary/20",
        text: "text-primary",
        border: "border-primary/30",
      };
    case "agency":
      return {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        border: "border-purple-500/30",
      };
    case "free":
    default:
      return {
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-border",
      };
  }
}

