// lib/workflow/connectionValidator.ts

import { WorkflowPlan } from "./types";
import { prisma } from "@/lib/prisma";
import { validateAppsSupported } from "./supportedApps"; // NEW

export type ConnectionValidationResult =
  | { ok: true }
  | { ok: false; error: string; missingApps: string[] };

/**
 * Extract app names from workflow trigger and actions
 * 
 * This is a simplified extraction. In a real system, you'd need to:
 * - Parse trigger config to identify which app it uses
 * - Parse each action to identify which app it uses
 * - Handle different action types (http_request might not use an app, but send_email does)
 * 
 * For MVP, we'll extract apps based on action types and trigger types.
 */
function extractAppsFromWorkflow(plan: WorkflowPlan): string[] {
  const apps: Set<string> = new Set();

  // Extract from trigger
  // Example: webhook triggers don't require an app, but app-specific triggers do
  if (plan.trigger.type === "webhook") {
    // Webhooks don't require an app connection
  } else if (plan.trigger.type === "cron") {
    // Cron triggers don't require an app connection
  } else if (plan.trigger.type === "manual") {
    // Manual triggers don't require an app connection
  }
  // Future: Add app-specific trigger types here

  // Extract from actions
  for (const action of plan.actions) {
    switch (action.type) {
      case "send_email":
        // Email actions typically require an email service connection (e.g., SendGrid, SMTP)
        // For MVP, we'll assume this requires a generic "email" connection
        // In production, you'd parse action.params to determine specific service
        apps.add("email");
        break;
      case "http_request":
        // HTTP requests might use an app connection if authRef is specified
        if (action.params.authRef) {
          // authRef points to a connection, but we need to determine which app
          // For MVP, we'll need to track this differently or require app name in action
          // This is a limitation that should be addressed
        }
        break;
      case "set_data":
        // Set data actions don't require app connections
        break;
      case "delay":
        // Delay actions don't require app connections
        break;
      // Future: Add more action types here
    }
  }

  return Array.from(apps);
}

/**
 * Validate that all required apps for a workflow are supported and connected
 * 
 * This function performs two validations:
 * 1. Checks if all apps are in the supported apps list
 * 2. Checks if all apps are connected and active for the user
 * 
 * @param plan - The workflow plan to validate
 * @param userId - The user ID to check connections for
 * @returns Validation result with details about missing/unsupported apps
 */
export async function validateAppConnections(
  plan: WorkflowPlan,
  userId: string
): Promise<ConnectionValidationResult> {
  // Extract apps needed by this workflow
  const requiredApps = extractAppsFromWorkflow(plan);

  // If no apps required, validation passes
  if (requiredApps.length === 0) {
    return { ok: true };
  }

  // NEW: First, validate all apps are supported (dynamically checks Pipedream)
  const supportedValidation = await validateAppsSupported(requiredApps);
  if (!supportedValidation.ok) {
    return {
      ok: false,
      error: `The following apps are not currently available in Pipedream: ${supportedValidation.unsupportedApps.join(", ")}`,
      missingApps: supportedValidation.unsupportedApps,
    };
  }

  // Then, validate all apps are connected
  const connections = await prisma.connection.findMany({
    where: {
      user_id: userId,
      service_name: { in: requiredApps },
      status: "active",
    },
  });

  const connectedApps = new Set(connections.map((c) => c.service_name));
  const missingApps = requiredApps.filter((app) => !connectedApps.has(app));

  if (missingApps.length > 0) {
    return {
      ok: false,
      error: `The following apps must be connected before creating this workflow: ${missingApps.join(", ")}`,
      missingApps,
    };
  }

  return { ok: true };
}

/**
 * Helper to extract app name from action params
 * 
 * This is a placeholder. In production, actions should explicitly specify
 * which app they use, or we need a mapping from action types to apps.
 */
export function getAppFromAction(action: WorkflowPlan["actions"][number]): string | null {
  // This is a simplified implementation
  // In production, actions should have an "app" field or similar
  switch (action.type) {
    case "send_email":
      return "email";
    default:
      return null;
  }
}

