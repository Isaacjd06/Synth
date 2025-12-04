// lib/workflow/supportedApps.ts

/**
 * Supported Apps Configuration
 * 
 * This list defines which apps Synth can integrate with for workflow automation.
 * 
 * CRITICAL RULE: Synth must ONLY mention apps that are actually in this list.
 * 
 * See: knowledge/app-connections/supported-apps.md
 */

export interface SupportedApp {
  name: string;
  category: string; // e.g., "Email", "Messaging", "CRM", etc.
  connectionType: "OAuth" | "APIKey" | "Both";
  availableTriggers?: string[]; // e.g., ["new_email", "email_received"]
  availableActions?: string[]; // e.g., ["send_email", "create_draft"]
  notes?: string;
}

/**
 * List of supported apps for MVP
 * 
 * NOTE: This list should be populated based on which apps are actually
 * integrated with Pipedream for the MVP. Update this as new apps are added.
 */
export const SUPPORTED_APPS: SupportedApp[] = [
  // Email apps
  {
    name: "email",
    category: "Email",
    connectionType: "Both",
    availableActions: ["send_email"],
    notes: "Generic email service (SMTP or email API)",
  },
  // TODO: Add more apps as they are integrated with Pipedream
  // Example:
  // {
  //   name: "Gmail",
  //   category: "Email",
  //   connectionType: "OAuth",
  //   availableTriggers: ["new_email"],
  //   availableActions: ["send_email", "create_draft"],
  // },
  // {
  //   name: "Slack",
  //   category: "Messaging",
  //   connectionType: "OAuth",
  //   availableTriggers: ["new_message"],
  //   availableActions: ["post_message", "create_channel"],
  // },
];

/**
 * Get list of supported app names
 */
export function getSupportedAppNames(): string[] {
  return SUPPORTED_APPS.map((app) => app.name);
}

/**
 * Check if an app is supported
 */
export function isAppSupported(appName: string): boolean {
  return SUPPORTED_APPS.some((app) => app.name === appName);
}

/**
 * Get supported app details
 */
export function getSupportedApp(appName: string): SupportedApp | undefined {
  return SUPPORTED_APPS.find((app) => app.name === appName);
}

/**
 * Validate that all apps in a list are supported
 */
export function validateAppsSupported(appNames: string[]): {
  ok: true;
} | {
  ok: false;
  unsupportedApps: string[];
} {
  const unsupportedApps = appNames.filter((app) => !isAppSupported(app));

  if (unsupportedApps.length > 0) {
    return {
      ok: false,
      unsupportedApps,
    };
  }

  return { ok: true };
}

