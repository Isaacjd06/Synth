/**
 * React Hook for Entitlements
 * 
 * Provides easy access to user entitlements in React components.
 * This hook wraps the subscription context and provides entitlement checking functions.
 * 
 * Usage:
 * ```tsx
 * const { hasEntitlement, getEntitlementValue, canUseIntegration } = useEntitlements();
 * 
 * if (hasEntitlement("customWebhooks")) {
 *   // Show custom webhooks feature
 * }
 * ```
 */

import { useSubscription } from "@/contexts/SubscriptionContext";
import { 
  getPlanEntitlements,
  hasEntitlement as checkEntitlement,
  getEntitlementValue as getValue,
  canUseIntegration as checkIntegration,
  hasAccess
} from "@/lib/entitlements-client";

export function useEntitlements() {
  const { plan, isSubscribed, subscriptionStatus, entitlements, isLoading } = useSubscription();

  /**
   * Check if user has a specific boolean entitlement
   */
  const hasEntitlement = (entitlement: keyof typeof import("@/lib/entitlements-client").PLAN_ENTITLEMENTS.starter): boolean => {
    if (isLoading || !isSubscribed) return false;
    return hasAccess(subscriptionStatus, plan, entitlement);
  };

  /**
   * Get a numeric entitlement value (e.g., maxActiveWorkflows)
   */
  const getEntitlementValue = (entitlement: keyof typeof import("@/lib/entitlements-client").PLAN_ENTITLEMENTS.starter): number => {
    if (isLoading || !isSubscribed) return 0;
    return getValue(plan, entitlement);
  };

  /**
   * Check if user can use a specific integration category
   */
  const canUseIntegration = (category: "basic" | "advanced" | "custom"): boolean => {
    if (isLoading || !isSubscribed) return false;
    return hasAccess(subscriptionStatus, plan, "customIntegrations") 
      ? checkIntegration(plan, category)
      : false;
  };

  /**
   * Get all entitlements for the current plan
   */
  const getAllEntitlements = () => {
    if (isLoading || !isSubscribed) return null;
    return entitlements;
  };

  /**
   * Check if user can perform an action (hasn't exceeded limit)
   */
  const canPerformAction = (
    entitlement: keyof typeof import("@/lib/entitlements-client").PLAN_ENTITLEMENTS.starter,
    currentUsage?: number
  ): boolean => {
    if (isLoading || !isSubscribed) return false;
    
    // Check if user has the entitlement
    if (!hasAccess(subscriptionStatus, plan, entitlement)) {
      return false;
    }

    // If checking a limit with current usage, verify we haven't exceeded it
    if (currentUsage !== undefined) {
      if (entitlement === "maxActiveWorkflows" || entitlement === "maxRunsPerMonth") {
        const limit = getValue(plan, entitlement);
        return currentUsage < limit;
      }
    }

    return true;
  };

  return {
    hasEntitlement,
    getEntitlementValue,
    canUseIntegration,
    getAllEntitlements,
    canPerformAction,
    entitlements,
    isLoading,
    isSubscribed,
    plan,
  };
}

