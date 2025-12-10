// lib/workflow/supportedApps.ts

/**
 * Dynamic Supported Apps Configuration
 * 
 * This module dynamically queries Pipedream to determine which apps are available.
 * NO HARDCODED APP LISTS - All apps available in Pipedream are automatically supported.
 * 
 * The system queries Pipedream's component library in real-time, so any app
 * available in Pipedream is automatically available in Synth.
 */

import { searchPipedreamConnections, getPipedreamConnectionDetails, type PipedreamConnection } from "@/lib/pipedream-connections";

export interface SupportedApp {
  name: string;
  key: string; // Pipedream component key
  category: string; // e.g., "Email", "Messaging", "CRM", etc.
  connectionType: "OAuth" | "APIKey" | "Both";
  availableTriggers?: string[]; // Dynamically determined from Pipedream
  availableActions?: string[]; // Dynamically determined from Pipedream
  description?: string;
  logo_url?: string;
  verified?: boolean;
  notes?: string;
}

/**
 * Cache for supported apps (refreshed periodically)
 */
let appsCache: SupportedApp[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Convert Pipedream connection to SupportedApp format
 */
function pipedreamConnectionToSupportedApp(conn: PipedreamConnection): SupportedApp {
  const authType = conn.auth?.type || "OAuth";
  
  return {
    name: conn.name,
    key: conn.key,
    category: conn.categories?.[0] || "Other",
    connectionType: authType === "oauth" ? "OAuth" : authType === "apikey" ? "APIKey" : "Both",
    description: conn.description,
    logo_url: conn.logo_url,
    verified: conn.verified,
    // Triggers and actions are determined dynamically when needed
    // They can be fetched from Pipedream component details if required
  };
}

/**
 * Get all supported apps from Pipedream (with caching)
 * 
 * @param forceRefresh - Force refresh of cache
 * @returns List of all supported apps from Pipedream
 */
export async function getSupportedApps(forceRefresh: boolean = false): Promise<SupportedApp[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (!forceRefresh && appsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return appsCache;
  }

  try {
    // Query Pipedream for all available connections
    // Use a large limit to get as many as possible
    const result = await searchPipedreamConnections(undefined, undefined, 1000, 0);
    
    // Convert Pipedream connections to SupportedApp format
    appsCache = result.connections.map(pipedreamConnectionToSupportedApp);
    cacheTimestamp = now;
    
    return appsCache;
  } catch (error) {
    console.error("Failed to fetch supported apps from Pipedream:", error);
    
    // Return cached data if available, even if stale
    if (appsCache) {
      return appsCache;
    }
    
    // If no cache and fetch fails, return empty array
    // This allows the system to continue functioning
    return [];
  }
}

/**
 * Get list of supported app names (dynamically from Pipedream)
 */
export async function getSupportedAppNames(): Promise<string[]> {
  const apps = await getSupportedApps();
  return apps.map((app) => app.name);
}

/**
 * Check if an app is supported (dynamically checks Pipedream)
 * 
 * @param appName - Name or key of the app to check
 * @returns true if app is available in Pipedream
 */
export async function isAppSupported(appName: string): Promise<boolean> {
  // Normalize app name
  const normalized = appName.toLowerCase().trim();
  
  // Check cache first
  const apps = await getSupportedApps();
  const found = apps.some(
    (app) => app.name.toLowerCase() === normalized || app.key.toLowerCase() === normalized
  );
  
  if (found) {
    return true;
  }
  
  // If not in cache, try fetching directly from Pipedream
  try {
    const connection = await getPipedreamConnectionDetails(normalized);
    return connection !== null;
  } catch {
    return false;
  }
}

/**
 * Get supported app details (from Pipedream)
 * 
 * @param appName - Name or key of the app
 * @returns App details if found
 */
export async function getSupportedApp(appName: string): Promise<SupportedApp | undefined> {
  const normalized = appName.toLowerCase().trim();
  
  // Check cache first
  const apps = await getSupportedApps();
  let app = apps.find(
    (a) => a.name.toLowerCase() === normalized || a.key.toLowerCase() === normalized
  );
  
  if (app) {
    return app;
  }
  
  // If not in cache, fetch from Pipedream
  try {
    const connection = await getPipedreamConnectionDetails(normalized);
    if (connection) {
      return pipedreamConnectionToSupportedApp(connection);
    }
  } catch (error) {
    console.error(`Failed to get app details for ${appName}:`, error);
  }
  
  return undefined;
}

/**
 * Validate that all apps in a list are supported (checks Pipedream)
 * 
 * @param appNames - List of app names to validate
 * @returns Validation result
 */
export async function validateAppsSupported(appNames: string[]): Promise<{
  ok: true;
} | {
  ok: false;
  unsupportedApps: string[];
}> {
  const unsupportedApps: string[] = [];
  
  // Check all apps in parallel
  const checks = await Promise.all(
    appNames.map(async (appName) => {
      const supported = await isAppSupported(appName);
      if (!supported) {
        unsupportedApps.push(appName);
      }
    })
  );
  
  await Promise.all(checks);

  if (unsupportedApps.length > 0) {
    return {
      ok: false,
      unsupportedApps,
    };
  }

  return { ok: true };
}

/**
 * Search for apps by query (searches Pipedream)
 * 
 * @param query - Search query
 * @param limit - Maximum results
 * @returns Matching apps
 */
export async function searchApps(query: string, limit: number = 50): Promise<SupportedApp[]> {
  try {
    const result = await searchPipedreamConnections(query, undefined, limit, 0);
    return result.connections.map(pipedreamConnectionToSupportedApp);
  } catch (error) {
    console.error("Failed to search apps:", error);
    return [];
  }
}

/**
 * Get apps by category (from Pipedream)
 * 
 * @param category - Category to filter by
 * @param limit - Maximum results
 * @returns Apps in category
 */
export async function getAppsByCategory(category: string, limit: number = 50): Promise<SupportedApp[]> {
  try {
    const result = await searchPipedreamConnections(undefined, category, limit, 0);
    return result.connections.map(pipedreamConnectionToSupportedApp);
  } catch (error) {
    console.error("Failed to get apps by category:", error);
    return [];
  }
}

