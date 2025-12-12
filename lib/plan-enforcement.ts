/**
 * Plan Enforcement Utilities
 * 
 * Centralized logic for enforcing subscription plan limits and restrictions.
 * This is the single source of truth for plan-based access control.
 * 
 * Uses the integrations module for integration access control.
 */

import { SubscriptionPlan } from "@prisma/client";
import {
  canAccessIntegration,
  getIntegrationIdsForPlan,
  getIntegrationPlanTier,
  resolveIntegrationId,
  extractIntegrationIdsFromWorkflow,
  type IntegrationMetadata,
} from "@/lib/integrations";

export type SubscriptionPlanType = SubscriptionPlan;

/**
 * Plan capabilities interface
 */
export interface PlanCapabilities {
  plan: SubscriptionPlan;
  maxWorkflows: number | null; // null = unlimited
  maxMonthlyExecutions: number | null; // null = unlimited
  allowedIntegrations: readonly string[];
  canConnectExternalApps: boolean;
  canUseAdvancedFeatures: boolean;
}

/**
 * Get all capabilities for a given plan
 */
export function getUserPlanCapabilities(plan: SubscriptionPlan | string | null | undefined): PlanCapabilities {
  const normalizedPlan = normalizePlan(plan);
  
  switch (normalizedPlan) {
    case "free":
      return {
        plan: "free",
        maxWorkflows: 0, // Free plan is view-only, cannot create workflows
        maxMonthlyExecutions: 0, // Free plan is view-only, cannot execute workflows
        allowedIntegrations: [], // Free plan cannot connect any integrations
        canConnectExternalApps: false,
        canUseAdvancedFeatures: false,
      };
    
    case "starter":
      return {
        plan: "starter",
        maxWorkflows: 5,
        maxMonthlyExecutions: 1000,
        allowedIntegrations: getIntegrationIdsForPlan("starter"),
        canConnectExternalApps: true,
        canUseAdvancedFeatures: false,
      };
    
    case "pro":
      return {
        plan: "pro",
        maxWorkflows: 25,
        maxMonthlyExecutions: 10000,
        allowedIntegrations: getIntegrationIdsForPlan("pro"),
        canConnectExternalApps: true,
        canUseAdvancedFeatures: true,
      };
    
    case "agency":
      return {
        plan: "agency",
        maxWorkflows: null, // unlimited
        maxMonthlyExecutions: null, // unlimited
        allowedIntegrations: getIntegrationIdsForPlan("agency"),
        canConnectExternalApps: true,
        canUseAdvancedFeatures: true,
      };
    
    default:
      // Default to free plan
      return getUserPlanCapabilities("free");
  }
}

/**
 * Normalize plan string to SubscriptionPlan type
 */
function normalizePlan(plan: SubscriptionPlan | string | null | undefined): SubscriptionPlan {
  if (!plan) return "free";
  
  const normalized = plan.toLowerCase().trim();
  
  if (normalized === "free" || normalized === "none" || normalized === "inactive") return "free";
  if (normalized === "starter") return "starter";
  if (normalized === "pro" || normalized === "growth") return "pro";
  if (normalized === "agency" || normalized === "scale" || normalized === "enterprise") return "agency";
  
  return "free";
}

/**
 * Check if a specific integration/service is allowed for a plan
 * 
 * @param plan - User's subscription plan
 * @param serviceName - Integration service name (will be normalized)
 * @returns true if the integration is allowed for the plan
 */
export function isIntegrationAllowed(
  plan: SubscriptionPlan | string | null | undefined,
  serviceName: string
): boolean {
  const normalizedPlan = normalizePlan(plan);
  
  // Free plan: no external integrations allowed
  if (normalizedPlan === "free") {
    return false;
  }
  
  return canAccessIntegration(normalizedPlan, serviceName);
}

/**
 * Assert that a user's plan can access a specific integration
 * Throws an error if access is denied
 * 
 * STRICT: Only allows integrations from our defined list of 40.
 * Rejects any integration not in our list.
 * 
 * @param plan - User's subscription plan
 * @param serviceName - Integration service name
 * @throws Error if integration is not allowed or not in our list
 */
export function assertIntegrationAllowed(
  plan: SubscriptionPlan | string | null | undefined,
  serviceName: string
): void {
  // First check if the integration exists in our list (STRICT validation)
  const resolvedId = resolveIntegrationId(serviceName);
  if (!resolvedId) {
    const error = new Error("This integration is not available. Only the 40 supported integrations can be connected.");
    (error as any).code = "INTEGRATION_NOT_FOUND";
    (error as any).upgradeRequired = false;
    throw error;
  }
  
  // Then check if it's allowed for the plan
  if (!isIntegrationAllowed(plan, serviceName)) {
    const normalizedPlan = normalizePlan(plan);
    const requiredTier = getIntegrationPlanTier(serviceName);
    
    let errorMessage = "This integration is not available on your current plan.";
    
    if (requiredTier) {
      errorMessage = `This integration requires a ${requiredTier} plan or higher. Your current plan: ${normalizedPlan}.`;
    }
    
    const error = new Error(errorMessage);
    (error as any).code = "INTEGRATION_NOT_ALLOWED";
    (error as any).upgradeRequired = true;
    (error as any).requiredPlan = requiredTier;
    (error as any).currentPlan = normalizedPlan;
    
    throw error;
  }
}

/**
 * Get list of allowed integrations for a plan
 */
export function getAllowedIntegrations(plan: SubscriptionPlan | string | null | undefined): readonly string[] {
  const capabilities = getUserPlanCapabilities(plan);
  return capabilities.allowedIntegrations;
}

/**
 * Check if plan can connect to external apps
 */
export function canConnectExternalApps(plan: SubscriptionPlan | string | null | undefined): boolean {
  const capabilities = getUserPlanCapabilities(plan);
  return capabilities.canConnectExternalApps;
}

/**
 * Check if user can create a new workflow
 */
export function canCreateWorkflow(
  plan: SubscriptionPlan | string | null | undefined,
  existingWorkflowCount: number
): { allowed: boolean; reason?: string } {
  const capabilities = getUserPlanCapabilities(plan);
  
  if (capabilities.maxWorkflows === null) {
    return { allowed: true };
  }
  
  if (existingWorkflowCount >= capabilities.maxWorkflows) {
    return {
      allowed: false,
      reason: `Plan limit reached. Maximum ${capabilities.maxWorkflows} workflow${capabilities.maxWorkflows > 1 ? "s" : ""} allowed on ${capabilities.plan} plan.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can execute a workflow (monthly limit check)
 */
export function canExecuteWorkflow(
  plan: SubscriptionPlan | string | null | undefined,
  monthlyExecutionCount: number
): { allowed: boolean; reason?: string } {
  const capabilities = getUserPlanCapabilities(plan);
  
  // Agency plan: unlimited
  if (capabilities.maxMonthlyExecutions === null) {
    return { allowed: true };
  }
  
  // Free plan: no limit on executions, but restricted to internal actions only
  // This check is handled at the workflow action level, not here
  if (capabilities.plan === "free") {
    return { allowed: true };
  }
  
  if (monthlyExecutionCount >= capabilities.maxMonthlyExecutions) {
    return {
      allowed: false,
      reason: `Monthly execution limit reached. Maximum ${capabilities.maxMonthlyExecutions} executions per month on ${capabilities.plan} plan.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Get the maximum number of workflows for a plan
 */
export function getPlanWorkflowLimit(plan: SubscriptionPlan | string | null | undefined): number | null {
  const capabilities = getUserPlanCapabilities(plan);
  return capabilities.maxWorkflows;
}

/**
 * Get the maximum monthly executions for a plan
 */
export function getPlanExecutionLimit(plan: SubscriptionPlan | string | null | undefined): number | null {
  const capabilities = getUserPlanCapabilities(plan);
  return capabilities.maxMonthlyExecutions;
}

/**
 * Check if workflow action uses external integration (for free plan restrictions)
 */
export function usesExternalIntegration(action: unknown): boolean {
  if (!action || typeof action !== "object") return false;
  
  // Check if action has integration/service references
  const actionStr = JSON.stringify(action).toLowerCase();
  
  // List of patterns that indicate external integration usage
  const externalPatterns = [
    "gmail",
    "slack",
    "discord",
    "notion",
    "airtable",
    "stripe",
    "webhook",
    "http",
    "api",
    "oauth",
    "connection",
  ];
  
  // Exclude internal Synth actions
  const internalPatterns = [
    "synth",
    "internal",
    "system",
  ];
  
  // If it contains internal patterns, it's not external
  if (internalPatterns.some(pattern => actionStr.includes(pattern))) {
    return false;
  }
  
  // Check for external patterns
  return externalPatterns.some(pattern => actionStr.includes(pattern));
}

/**
 * Validate workflow actions for free plan (must be internal only)
 */
export function validateWorkflowForFreePlan(actions: unknown[]): { valid: boolean; reason?: string } {
  if (!Array.isArray(actions)) {
    return { valid: true }; // Empty or invalid actions array
  }
  
  for (const action of actions) {
    if (usesExternalIntegration(action)) {
      return {
        valid: false,
        reason: "Free plan workflows can only use internal Synth actions. External integrations require a subscription.",
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate that all integrations in a workflow are allowed for the user's plan
 * 
 * @param plan - User's subscription plan
 * @param workflow - Workflow object with trigger and actions
 * @returns Validation result with list of restricted integrations if any
 */
export function validateWorkflowIntegrations(
  plan: SubscriptionPlan | string | null | undefined,
  workflow: {
    trigger?: unknown;
    actions?: unknown[];
  }
): { valid: boolean; restrictedIntegrations?: string[]; reason?: string } {
  const normalizedPlan = normalizePlan(plan);
  
  // Free plan: no external integrations allowed
  if (normalizedPlan === "free") {
    const freeValidation = validateWorkflowForFreePlan(workflow.actions || []);
    if (!freeValidation.valid) {
      return {
        valid: false,
        reason: freeValidation.reason || "Free plan workflows cannot use external integrations.",
      };
    }
    return { valid: true };
  }
  
  // Extract integration IDs from workflow
  const integrationIds = extractIntegrationIdsFromWorkflow(workflow);
  
  if (integrationIds.length === 0) {
    return { valid: true }; // No integrations found, assume valid
  }
  
  // Check each integration
  const restrictedIntegrations: string[] = [];
  for (const integrationId of integrationIds) {
    if (!isIntegrationAllowed(normalizedPlan, integrationId)) {
      restrictedIntegrations.push(integrationId);
    }
  }
  
  if (restrictedIntegrations.length > 0) {
    return {
      valid: false,
      restrictedIntegrations,
      reason: `The following integrations are not available on your ${normalizedPlan} plan: ${restrictedIntegrations.join(", ")}. Please upgrade to use these integrations.`,
    };
  }
  
  return { valid: true };
}
