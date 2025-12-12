/**
 * Integration Configuration Module
 * 
 * This is the SINGLE SOURCE OF TRUTH for all integration metadata and plan-tier assignments.
 * All 40 integrations are defined here with their exact plan tiers.
 * 
 * DO NOT modify these values without explicit approval.
 * This module is the global authority for plan-level access controls.
 */

import { SubscriptionPlan } from "@prisma/client";

/**
 * Integration metadata structure
 */
export interface IntegrationMetadata {
  /** Unique identifier for the integration (normalized, lowercase, hyphenated) */
  id: string;
  /** Display name for the integration */
  name: string;
  /** Category/type of integration */
  category: string;
  /** Minimum subscription plan required to access this integration */
  planTier: SubscriptionPlan;
  /** Whether this integration supports triggers */
  supportsTriggers: boolean;
  /** Whether this integration supports actions */
  supportsActions: boolean;
  /** Internal metadata (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Service name normalization
 * Converts various service name formats to the canonical ID format
 */
export function normalizeServiceName(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/**
 * Service name aliases mapping
 * Maps common variations to canonical integration IDs
 */
const SERVICE_ALIASES: Record<string, string> = {
  // Gmail variations
  "gmail": "gmail",
  "google-mail": "gmail",
  "googlemail": "gmail",
  
  // Google Calendar variations
  "google-calendar": "google-calendar",
  "googlecalendar": "google-calendar",
  "gcal": "google-calendar",
  
  // Google Sheets variations
  "google-sheets": "google-sheets",
  "googlesheets": "google-sheets",
  "gsheets": "google-sheets",
  
  // Google Drive variations
  "google-drive": "google-drive",
  "googledrive": "google-drive",
  "gdrive": "google-drive",
  
  // Google Forms variations
  "google-forms": "google-forms",
  "googleforms": "google-forms",
  "gforms": "google-forms",
  
  // Email/SMTP variations
  "email": "email-smtp",
  "email-smtp": "email-smtp",
  "smtp": "email-smtp",
  "mail": "email-smtp",
  
  // Webhooks variations
  "webhooks": "webhooks",
  "webhook": "webhooks",
  "standard-webhooks": "webhooks",
  "http-webhook": "webhooks",
  
  // Microsoft Outlook variations
  "microsoft-outlook": "microsoft-outlook",
  "outlook": "microsoft-outlook",
  "ms-outlook": "microsoft-outlook",
  
  // Microsoft OneDrive variations
  "microsoft-onedrive": "microsoft-onedrive",
  "onedrive": "microsoft-onedrive",
  "ms-onedrive": "microsoft-onedrive",
  
  // Microsoft To Do variations
  "microsoft-to-do": "microsoft-to-do",
  "microsoft-todo": "microsoft-to-do",
  "mstodo": "microsoft-to-do",
  "ms-to-do": "microsoft-to-do",
  
  // Dropbox variations
  "dropbox-paper": "dropbox-paper",
  "dropboxpaper": "dropbox-paper",
  "dropbox-core": "dropbox-core",
  "dropboxcore": "dropbox-core",
  "dropbox": "dropbox-core",
  
  // Custom HTTP variations
  "custom-http-integrations": "custom-http-integrations",
  "custom-http": "custom-http-integrations",
  "advanced-webhooks": "custom-http-integrations",
  "advanced-webhooks-expansion": "custom-http-integrations",
  
  // HighLevel variations
  "highlevel": "highlevel",
  "gohighlevel": "highlevel",
  "ghl": "highlevel",
  
  // Make.com variations
  "make-com": "make-com",
  "make": "make-com",
  "makecom": "make-com",
  "integromat": "make-com",
  
  // LinkedIn variations
  "linkedin-lead-gen": "linkedin-lead-gen",
  "linkedin": "linkedin-lead-gen",
  "linkedin-lead-generation": "linkedin-lead-gen",
  
  // Meta/Facebook variations
  "meta-lead-ads": "meta-lead-ads",
  "facebook-lead-ads": "meta-lead-ads",
  "instagram-lead-ads": "meta-lead-ads",
  "meta": "meta-lead-ads",
  "facebook": "meta-lead-ads",
  "instagram": "meta-lead-ads",
};

/**
 * Resolve service name to canonical integration ID
 * 
 * STRICT MODE: Only returns IDs that are in our defined list of 40 integrations.
 * Returns null for any integration not in our list.
 */
export function resolveIntegrationId(serviceName: string): string | null {
  const normalized = normalizeServiceName(serviceName);
  
  // Check aliases first
  if (SERVICE_ALIASES[normalized]) {
    const aliasId = SERVICE_ALIASES[normalized];
    // Verify the alias maps to a real integration
    if (INTEGRATIONS_MAP.has(aliasId)) {
      return aliasId;
    }
    return null; // Alias doesn't map to a valid integration
  }
  
  // Check if it's already a canonical ID
  if (INTEGRATIONS_MAP.has(normalized)) {
    return normalized;
  }
  
  // STRICT: Do not allow partial matches or unknown integrations
  // Only return integrations that are explicitly in our list
  return null;
}

/**
 * All 40 integrations with their metadata
 * 
 * STARTER PLAN INTEGRATIONS (1-15)
 * PRO PLAN INTEGRATIONS (16-30) - includes all Starter
 * AGENCY PLAN INTEGRATIONS (31-40) - includes all Starter + Pro
 */
const INTEGRATIONS: IntegrationMetadata[] = [
  // ===== STARTER PLAN INTEGRATIONS (1-15) =====
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "Storage",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "google-forms",
    name: "Google Forms",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "email-smtp",
    name: "Email (SMTP)",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: false,
    supportsActions: true,
  },
  {
    id: "webhooks",
    name: "Standard Webhooks",
    category: "Integration",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "discord",
    name: "Discord",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "microsoft-outlook",
    name: "Microsoft Outlook",
    category: "Communication",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "microsoft-onedrive",
    name: "Microsoft OneDrive",
    category: "Storage",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "microsoft-to-do",
    name: "Microsoft To Do",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "evernote",
    name: "Evernote",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "todoist",
    name: "Todoist",
    category: "Productivity",
    planTier: "starter",
    supportsTriggers: true,
    supportsActions: true,
  },
  
  // ===== PRO PLAN INTEGRATIONS (16-30) =====
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "trello",
    name: "Trello",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "clickup",
    name: "ClickUp",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "monday-com",
    name: "Monday.com",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "asana",
    name: "Asana",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "dropbox-paper",
    name: "Dropbox Paper",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "dropbox-core",
    name: "Dropbox Core",
    category: "Storage",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "canva",
    name: "Canva",
    category: "Design",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "typeform",
    name: "Typeform",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "hubspot-crm",
    name: "HubSpot CRM",
    category: "CRM",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "salesforce-essentials",
    name: "Salesforce Essentials",
    category: "CRM",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "Communication",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Productivity",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "Web",
    planTier: "pro",
    supportsTriggers: true,
    supportsActions: true,
  },
  
  // ===== AGENCY PLAN INTEGRATIONS (31-40) =====
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Finance",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "xero",
    name: "Xero",
    category: "Finance",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "E-commerce",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "custom-http-integrations",
    name: "Custom HTTP Integrations",
    category: "Integration",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
    metadata: {
      description: "Advanced Webhooks Expansion",
    },
  },
  {
    id: "highlevel",
    name: "HighLevel (GoHighLevel)",
    category: "CRM",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "make-com",
    name: "Make.com Connector",
    category: "Integration",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
    metadata: {
      description: "Limited Access",
    },
  },
  {
    id: "linkedin-lead-gen",
    name: "LinkedIn Lead Gen",
    category: "Marketing",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
  },
  {
    id: "meta-lead-ads",
    name: "Meta Lead Ads",
    category: "Marketing",
    planTier: "agency",
    supportsTriggers: true,
    supportsActions: true,
    metadata: {
      description: "Facebook/Instagram Lead Ads",
    },
  },
];

/**
 * Map of integration ID to metadata
 */
export const INTEGRATIONS_MAP = new Map<string, IntegrationMetadata>(
  INTEGRATIONS.map(integration => [integration.id, integration])
);

/**
 * Get integration metadata by ID
 */
export function getIntegrationMetadata(integrationId: string): IntegrationMetadata | null {
  const resolvedId = resolveIntegrationId(integrationId);
  if (!resolvedId) {
    return null;
  }
  return INTEGRATIONS_MAP.get(resolvedId) || null;
}

/**
 * Get all integrations for a specific plan tier
 * Returns all integrations that are accessible at the given tier or below
 */
export function getIntegrationsForPlan(plan: SubscriptionPlan): readonly IntegrationMetadata[] {
  switch (plan) {
    case "agency":
      return INTEGRATIONS; // All 40 integrations
    case "pro":
      return INTEGRATIONS.filter(i => i.planTier === "starter" || i.planTier === "pro"); // 1-30
    case "starter":
      return INTEGRATIONS.filter(i => i.planTier === "starter"); // 1-15
    case "free":
    default:
      return []; // No integrations for free plan
  }
}

/**
 * Get integration IDs for a specific plan tier
 */
export function getIntegrationIdsForPlan(plan: SubscriptionPlan): readonly string[] {
  return getIntegrationsForPlan(plan).map(i => i.id);
}

/**
 * STARTER plan integrations (IDs only)
 */
export const STARTER_INTEGRATION_IDS = INTEGRATIONS
  .filter(i => i.planTier === "starter")
  .map(i => i.id) as readonly string[];

/**
 * PRO plan integrations (IDs only) - includes all Starter
 */
export const PRO_INTEGRATION_IDS = INTEGRATIONS
  .filter(i => i.planTier === "starter" || i.planTier === "pro")
  .map(i => i.id) as readonly string[];

/**
 * AGENCY plan integrations (IDs only) - includes all Starter + Pro
 */
export const AGENCY_INTEGRATION_IDS = INTEGRATIONS.map(i => i.id) as readonly string[];

/**
 * All integration IDs
 */
export const ALL_INTEGRATION_IDS = INTEGRATIONS.map(i => i.id) as readonly string[];

/**
 * Check if a plan tier has access to another plan tier
 */
function planTierHasAccess(userPlan: SubscriptionPlan, requiredTier: SubscriptionPlan): boolean {
  const tierOrder: Record<SubscriptionPlan, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    agency: 3,
  };
  
  return tierOrder[userPlan] >= tierOrder[requiredTier];
}

/**
 * Check if a user's plan can access a specific integration
 */
export function canAccessIntegration(
  userPlan: SubscriptionPlan | string | null | undefined,
  integrationId: string
): boolean {
  // Normalize plan
  const normalizedPlan = normalizePlan(userPlan);
  
  // Free plan has no integrations
  if (normalizedPlan === "free") {
    return false;
  }
  
  // Resolve integration ID
  const resolvedId = resolveIntegrationId(integrationId);
  if (!resolvedId) {
    return false;
  }
  
  // Get integration metadata
  const integration = INTEGRATIONS_MAP.get(resolvedId);
  if (!integration) {
    return false;
  }
  
  // Check if user's plan tier has access to the integration's required tier
  return planTierHasAccess(normalizedPlan, integration.planTier);
}

/**
 * Get the plan tier required for a specific integration
 */
export function getIntegrationPlanTier(integrationId: string): SubscriptionPlan | null {
  const resolvedId = resolveIntegrationId(integrationId);
  if (!resolvedId) {
    return null;
  }
  
  const integration = INTEGRATIONS_MAP.get(resolvedId);
  return integration?.planTier || null;
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
 * Extract integration IDs from workflow trigger/actions
 * Recursively searches for integration references in workflow data
 * 
 * STRICT: Only returns integration IDs that are in our defined list of 40.
 */
export function extractIntegrationIdsFromWorkflow(workflow: {
  trigger?: unknown;
  actions?: unknown[];
}): string[] {
  const integrationIds: Set<string> = new Set();
  
  // Extract from trigger
  if (workflow.trigger && typeof workflow.trigger === "object") {
    const triggerStr = JSON.stringify(workflow.trigger).toLowerCase();
    for (const integration of INTEGRATIONS) {
      // Check for both ID and name matches
      const idMatch = triggerStr.includes(integration.id);
      const nameMatch = triggerStr.includes(integration.name.toLowerCase());
      
      if (idMatch || nameMatch) {
        // Only add if it's a valid integration from our list
        if (INTEGRATIONS_MAP.has(integration.id)) {
          integrationIds.add(integration.id);
        }
      }
    }
  }
  
  // Extract from actions
  if (Array.isArray(workflow.actions)) {
    for (const action of workflow.actions) {
      if (action && typeof action === "object") {
        const actionStr = JSON.stringify(action).toLowerCase();
        for (const integration of INTEGRATIONS) {
          // Check for both ID and name matches
          const idMatch = actionStr.includes(integration.id);
          const nameMatch = actionStr.includes(integration.name.toLowerCase());
          
          if (idMatch || nameMatch) {
            // Only add if it's a valid integration from our list
            if (INTEGRATIONS_MAP.has(integration.id)) {
              integrationIds.add(integration.id);
            }
          }
        }
      }
    }
  }
  
  return Array.from(integrationIds);
}
