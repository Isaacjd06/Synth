/**
 * Pipedream Connections/Sources API Client
 * 
 * Provides functions for searching and listing available Pipedream connections (sources/components).
 * These are the thousands of out-of-the-box OAuth connections available through Pipedream.
 * 
 * Environment Variables Required:
 * - PIPEDREAM_API_KEY: Pipedream API authentication key
 * - PIPEDREAM_API_URL: Base URL for Pipedream API (defaults to https://api.pipedream.com/v1)
 */

import { PipedreamError } from "./pipedream";

const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || "https://api.pipedream.com/v1";

/**
 * Pipedream connection/source information
 */
export interface PipedreamConnection {
  id: string;
  name: string;
  description?: string;
  key: string; // The key used to reference this connection (e.g., "gmail", "slack")
  version?: string;
  type?: "source" | "action";
  auth?: {
    type: "oauth" | "apikey" | "basic";
    oauth_version?: "1.0" | "2.0";
  };
  logo_url?: string;
  homepage_url?: string;
  categories?: string[];
  verified?: boolean;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Search/list available Pipedream connections
 * 
 * @param searchQuery - Optional search query to filter connections
 * @param category - Optional category filter
 * @param limit - Maximum number of results (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns List of available connections
 */
export async function searchPipedreamConnections(
  searchQuery?: string,
  category?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ connections: PipedreamConnection[]; total?: number }> {
  if (!PIPEDREAM_API_KEY) {
    throw new PipedreamError(
      "PIPEDREAM_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    if (category) {
      params.set("category", category);
    }
    params.set("limit", limit.toString());
    params.set("offset", offset.toString());

    // Pipedream API endpoint for components/sources
    // Common endpoints: /components, /sources, /apps
    const endpoint = `/components?${params.toString()}`;

    const response = await fetch(`${PIPEDREAM_API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      // If /components doesn't work, try /sources or /apps
      if (response.status === 404) {
        // Try alternative endpoint
        const altEndpoint = `/sources?${params.toString()}`;
        const altResponse = await fetch(`${PIPEDREAM_API_URL}${altEndpoint}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          return {
            connections: normalizeConnectionData(altData.data || altData.components || altData.sources || []),
            total: altData.total || altData.count,
          };
        }
      }

      throw new PipedreamError(
        `Failed to search Pipedream connections (${response.status}): ${JSON.stringify(errorBody)}`,
        response.status,
        errorBody
      );
    }

    const data = await response.json();

    // Handle different response formats
    const connections = normalizeConnectionData(
      data.data || data.components || data.sources || data.apps || []
    );

    return {
      connections,
      total: data.total || data.count || connections.length,
    };
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Error searching Pipedream connections: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

/**
 * Get detailed information about a specific Pipedream connection
 * 
 * @param connectionKey - The connection key (e.g., "gmail", "slack")
 * @returns Detailed connection information
 */
export async function getPipedreamConnectionDetails(
  connectionKey: string
): Promise<PipedreamConnection | null> {
  if (!PIPEDREAM_API_KEY) {
    throw new PipedreamError(
      "PIPEDREAM_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  if (!connectionKey) {
    throw new PipedreamError("connectionKey is required");
  }

  try {
    // Try multiple endpoint patterns
    const endpoints = [
      `/components/${connectionKey}`,
      `/sources/${connectionKey}`,
      `/apps/${connectionKey}`,
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${PIPEDREAM_API_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const connection = normalizeConnectionData([data.component || data.source || data.app || data])[0];
        return connection || null;
      }

      // If 404, try next endpoint
      if (response.status === 404) {
        continue;
      }

      // If other error, throw
      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        throw new PipedreamError(
          `Failed to get connection details (${response.status}): ${JSON.stringify(errorBody)}`,
          response.status,
          errorBody
        );
      }
    }

    // If all endpoints failed, return null
    return null;
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Error getting connection details: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

/**
 * Get popular/recommended connections (for suggested connections section)
 * 
 * @param limit - Maximum number of results (default: 12)
 * @returns List of popular connections
 */
export async function getPopularConnections(
  limit: number = 12
): Promise<PipedreamConnection[]> {
  // Get connections and filter/sort by popularity (or use Pipedream's popular endpoint if available)
  try {
    const result = await searchPipedreamConnections(undefined, undefined, limit, 0);
    
    // Sort by verified status first, then by name
    return result.connections.sort((a, b) => {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  } catch (error) {
    // If search fails, return empty array
    console.error("Failed to get popular connections:", error);
    return [];
  }
}

/**
 * Normalize connection data from different Pipedream API response formats
 */
function normalizeConnectionData(data: unknown[]): PipedreamConnection[] {
  return data.map((item: unknown) => {
    const obj = item as Record<string, unknown>;

    // Normalize auth property with proper type checking
    let auth: { type: "oauth" | "apikey" | "basic"; oauth_version?: "1.0" | "2.0" } | undefined;
    if (obj.auth && typeof obj.auth === "object") {
      const authObj = obj.auth as Record<string, unknown>;
      const authType = authObj.type as string;
      if (authType === "oauth" || authType === "apikey" || authType === "basic") {
        const oauthVersion = authObj.oauth_version as string;
        auth = {
          type: authType,
          oauth_version: (oauthVersion === "1.0" || oauthVersion === "2.0") ? oauthVersion : undefined,
        };
      }
    }

    return {
      id: String(obj.id || obj.key || ""),
      name: String(obj.name || obj.title || ""),
      description: obj.description ? String(obj.description) : undefined,
      key: String(obj.key || obj.id || obj.name || "").toLowerCase(),
      version: obj.version ? String(obj.version) : undefined,
      type: obj.type as "source" | "action" | undefined,
      auth,
      logo_url: obj.logo_url || obj.logo || obj.icon ? String(obj.logo_url || obj.logo || obj.icon) : undefined,
      homepage_url: obj.homepage_url || obj.url ? String(obj.homepage_url || obj.url) : undefined,
      categories: Array.isArray(obj.categories) ? obj.categories.map(String) : undefined,
      verified: obj.verified === true || obj.verified === "true",
      ...obj, // Include any additional fields
    };
  }).filter((conn) => conn.id && conn.name); // Filter out invalid entries
}

