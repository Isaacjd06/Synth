/**
 * Integration Plan Gating
 * 
 * Defines which integrations are available for each subscription plan.
 * This is the single source of truth for integration access control.
 */

import type { SubscriptionPlan } from "./subscription-client";

/**
 * All 40 integrations organized by plan tier
 */
export const INTEGRATIONS_BY_PLAN: Record<SubscriptionPlan, string[]> = {
  free: [], // FREE plan cannot connect any integrations
  
  starter: [
    // STARTER PLAN INTEGRATIONS (15 total)
    "gmail",
    "google-calendar",
    "google-sheets",
    "google-drive",
    "google-forms",
    "email-smtp",
    "webhooks",
    "slack",
    "discord",
    "zoom",
    "microsoft-outlook",
    "microsoft-onedrive",
    "microsoft-todo",
    "evernote",
    "todoist",
  ],
  
  pro: [
    // PRO PLAN INTEGRATIONS (includes all Starter + 15 more = 30 total)
    // Starter integrations
    "gmail",
    "google-calendar",
    "google-sheets",
    "google-drive",
    "google-forms",
    "email-smtp",
    "webhooks",
    "slack",
    "discord",
    "zoom",
    "microsoft-outlook",
    "microsoft-onedrive",
    "microsoft-todo",
    "evernote",
    "todoist",
    // Pro-only integrations
    "notion",
    "airtable",
    "trello",
    "clickup",
    "monday",
    "asana",
    "dropbox-paper",
    "dropbox-core",
    "canva",
    "typeform",
    "hubspot-crm",
    "salesforce-essentials",
    "intercom",
    "calendly",
    "webflow",
  ],
  
  agency: [
    // AGENCY PLAN INTEGRATIONS (includes all Pro + 10 more = 40 total)
    // All Pro integrations
    "gmail",
    "google-calendar",
    "google-sheets",
    "google-drive",
    "google-forms",
    "email-smtp",
    "webhooks",
    "slack",
    "discord",
    "zoom",
    "microsoft-outlook",
    "microsoft-onedrive",
    "microsoft-todo",
    "evernote",
    "todoist",
    "notion",
    "airtable",
    "trello",
    "clickup",
    "monday",
    "asana",
    "dropbox-paper",
    "dropbox-core",
    "canva",
    "typeform",
    "hubspot-crm",
    "salesforce-essentials",
    "intercom",
    "calendly",
    "webflow",
    // Agency-only integrations
    "stripe",
    "quickbooks",
    "xero",
    "shopify",
    "woocommerce",
    "custom-http-integrations",
    "highlevel",
    "make-connector",
    "linkedin-lead-gen",
    "meta-lead-ads",
  ],
  
  none: [], // No plan = no integrations
};

/**
 * Check if a user's plan allows access to a specific integration
 * 
 * @param plan - User's subscription plan
 * @param serviceName - Integration service name (normalized to lowercase)
 * @returns true if integration is allowed for the plan
 */
export function isIntegrationAllowedForPlan(
  plan: SubscriptionPlan | string | null | undefined,
  serviceName: string
): boolean {
  if (!plan || plan === "free" || plan === "none") {
    return false;
  }

  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan;
  const normalizedService = serviceName.toLowerCase().trim();

  const allowedIntegrations = INTEGRATIONS_BY_PLAN[normalizedPlan] || [];
  return allowedIntegrations.includes(normalizedService);
}

/**
 * Get all integrations allowed for a plan
 * 
 * @param plan - User's subscription plan
 * @returns Array of allowed integration service names
 */
export function getAllowedIntegrationsForPlan(
  plan: SubscriptionPlan | string | null | undefined
): string[] {
  if (!plan || plan === "free" || plan === "none") {
    return [];
  }

  const normalizedPlan = plan.toLowerCase() as SubscriptionPlan;
  return INTEGRATIONS_BY_PLAN[normalizedPlan] || [];
}

/**
 * Require integration access for a user
 * Returns error response if user doesn't have access to the integration
 * 
 * @param plan - User's subscription plan
 * @param serviceName - Integration service name
 * @returns Error response if not allowed, null if allowed
 */
export function requireIntegrationAccess(
  plan: SubscriptionPlan | string | null | undefined,
  serviceName: string
): { error: string; status: number; code: string; requiredPlan?: string } | null {
  if (!plan || plan === "free" || plan === "none") {
    return {
      error: "External app connections are not available on the free plan. Please upgrade to connect integrations.",
      status: 403,
      code: "SUBSCRIPTION_REQUIRED",
      requiredPlan: "starter",
    };
  }

  if (!isIntegrationAllowedForPlan(plan, serviceName)) {
    // Determine which plan is required
    let requiredPlan: SubscriptionPlan = "starter";
    if (INTEGRATIONS_BY_PLAN.pro.includes(serviceName.toLowerCase())) {
      requiredPlan = "pro";
    } else if (INTEGRATIONS_BY_PLAN.agency.includes(serviceName.toLowerCase())) {
      requiredPlan = "agency";
    }

    return {
      error: `This integration is not available on your current plan. Please upgrade to ${requiredPlan.toUpperCase()} or higher.`,
      status: 403,
      code: "INTEGRATION_NOT_AVAILABLE",
      requiredPlan,
    };
  }

  return null; // Access allowed
}

