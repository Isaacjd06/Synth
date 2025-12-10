/**
 * Pipedream OAuth Integration for Synth
 * 
 * Provides functions for managing OAuth connections through Pipedream.
 * Handles OAuth flow initiation, callback processing, and connection management.
 */

import { PipedreamError } from "./pipedream";

const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || "https://api.pipedream.com/v1";
const PIPEDREAM_USER_ID = process.env.PIPEDREAM_USER_ID;

/**
 * OAuth connection configuration for a service
 */
export interface OAuthConfig {
  serviceName: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * Initiate OAuth flow for a service
 * 
 * @param serviceName - Name of the service to connect
 * @param userId - User ID for state parameter
 * @param redirectUri - OAuth callback URL
 * @returns Authorization URL to redirect user to
 */
export async function initiateOAuthFlow(
  serviceName: string,
  userId: string,
  redirectUri: string
): Promise<{ authUrl: string; state: string }> {
  if (!PIPEDREAM_API_KEY) {
    throw new PipedreamError(
      "PIPEDREAM_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  // Generate state parameter for CSRF protection
  const state = `${userId}_${serviceName}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // Strategy 1: Use Pipedream's native OAuth endpoints (preferred)
    // Try multiple endpoint patterns for OAuth initiation
    const oauthEndpoints = [
      `/oauth/authorize`,
      `/v1/oauth/authorize`,
      `/sources/${serviceName.toLowerCase()}/oauth/authorize`,
      `/v1/sources/${serviceName.toLowerCase()}/oauth/authorize`,
      `/components/${serviceName.toLowerCase()}/oauth/authorize`,
      `/v1/components/${serviceName.toLowerCase()}/oauth/authorize`,
    ];

    for (const endpoint of oauthEndpoints) {
      try {
        const params = new URLSearchParams({
          service: serviceName,
          redirect_uri: redirectUri,
          state: state,
        });

        const response = await fetch(
          `${PIPEDREAM_API_URL}${endpoint}?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const authUrl = data.auth_url || data.url || data.authorization_url || data.redirect_url;
          
          if (authUrl) {
            return {
              authUrl: typeof authUrl === 'string' ? authUrl : String(authUrl),
              state,
            };
          }
        }

        // If 404, try next endpoint
        if (response.status === 404) {
          continue;
        }
      } catch (fetchError) {
        // Network error, continue to next endpoint
        continue;
      }
    }

    // Strategy 2: Use Pipedream's connection/source OAuth flow
    // Some services may require creating a connection first
    try {
      const connectionDetails = await import("./pipedream-connections").then(m => 
        m.getPipedreamConnectionDetails(serviceName.toLowerCase())
      );

      if (connectionDetails?.auth?.type === "oauth") {
        // If Pipedream connection exists, try to get OAuth URL from connection details
        // This may require additional API calls to Pipedream
      }
    } catch {
      // Ignore errors, continue to fallback
    }

    // Strategy 3: Fallback to direct service OAuth (if service config exists)
    // This is only used if Pipedream doesn't handle OAuth for this service
    const serviceConfig = getServiceOAuthConfig(serviceName);
    if (serviceConfig) {
      const scopes = serviceConfig.scopes?.join(" ") || "";
      const params = new URLSearchParams({
        client_id: serviceConfig.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        state: state,
        ...(scopes ? { scope: scopes } : {}),
      });

      return {
        authUrl: `${serviceConfig.authUrl}?${params.toString()}`,
        state,
      };
    }

    // If all strategies fail, throw error
    throw new PipedreamError(
      `OAuth flow not available for service: ${serviceName}. ` +
      `Please ensure the service is available in Pipedream or configure OAuth credentials.`
    );
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to initiate OAuth flow: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Exchange authorization code for access token
 * 
 * @param serviceName - Name of the service
 * @param code - Authorization code from callback
 * @param redirectUri - Same redirect URI used in initiation
 * @returns Access token and related information
 */
export async function exchangeCodeForToken(
  serviceName: string,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  sourceId?: string;
  authId?: string;
}> {
  if (!PIPEDREAM_API_KEY) {
    throw new PipedreamError(
      "PIPEDREAM_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  try {
    // Strategy 1: Use Pipedream's native token exchange (preferred)
    const tokenEndpoints = [
      `/oauth/token`,
      `/v1/oauth/token`,
      `/sources/${serviceName.toLowerCase()}/oauth/token`,
      `/v1/sources/${serviceName.toLowerCase()}/oauth/token`,
      `/components/${serviceName.toLowerCase()}/oauth/token`,
      `/v1/components/${serviceName.toLowerCase()}/oauth/token`,
    ];

    for (const endpoint of tokenEndpoints) {
      try {
        const response = await fetch(`${PIPEDREAM_API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service: serviceName,
            code,
            redirect_uri: redirectUri,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            accessToken: data.access_token || data.token || data.accessToken,
            refreshToken: data.refresh_token || data.refreshToken,
            expiresIn: data.expires_in || data.expiresIn,
            tokenType: data.token_type || data.tokenType || "Bearer",
            sourceId: data.source_id || data.sourceId,
            authId: data.auth_id || data.authId,
          };
        }

        // If 404, try next endpoint
        if (response.status === 404) {
          continue;
        }
      } catch (fetchError) {
        // Network error, continue to next endpoint
        continue;
      }
    }

    // Strategy 2: Fallback to direct service OAuth token exchange
    // Only used if Pipedream doesn't handle token exchange for this service
    const serviceConfig = getServiceOAuthConfig(serviceName);
    if (serviceConfig) {
      const tokenResponse = await fetch(serviceConfig.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: serviceConfig.clientId,
          client_secret: serviceConfig.clientSecret,
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        return {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in,
          tokenType: tokenData.token_type || "Bearer",
        };
      }
    }

    throw new PipedreamError(
      `Failed to exchange authorization code for token. ` +
      `Please ensure the service is properly configured in Pipedream or provide OAuth credentials.`
    );
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to exchange code for token: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Store OAuth credentials securely (placeholder for secure storage integration)
 * 
 * @param userId - User ID
 * @param serviceName - Service name
 * @param credentials - OAuth credentials to store
 */
export async function storeOAuthCredentials(
  userId: string,
  serviceName: string,
  credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    sourceId?: string;
    authId?: string;
  }
): Promise<void> {
  // TODO: Integrate with secure storage system
  // For now, this is a placeholder
  // In production, credentials should be stored in a secure vault/secret manager
  // and only references (sourceId, authId) should be stored in the database
  
  console.log(`[SECURE STORAGE PLACEHOLDER] Storing OAuth credentials for user ${userId}, service ${serviceName}`);
  
  // In a real implementation, this would:
  // 1. Encrypt the credentials
  // 2. Store in a secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
  // 3. Return a reference ID to store in the database
}

/**
 * Get OAuth configuration for a service
 * Service-specific OAuth configs can be stored in environment variables or a config file
 * 
 * @param serviceName - Name of the service
 * @returns OAuth configuration if available
 */
function getServiceOAuthConfig(serviceName: string): OAuthConfig | null {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/connections/callback`;

  // Service-specific configurations can be loaded from environment variables
  // or a configuration file/database
  const serviceConfigs: Record<string, OAuthConfig | null> = {
    // Example: Gmail configuration
    gmail: process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET
      ? {
          serviceName: "gmail",
          authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          redirectUri,
          scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"],
        }
      : null,
    
    // Add more service configs as needed
    // slack: { ... },
    // salesforce: { ... },
  };

  return serviceConfigs[serviceName.toLowerCase()] || null;
}

/**
 * Validate state parameter to prevent CSRF attacks
 * 
 * @param state - State parameter from OAuth callback
 * @param userId - Expected user ID
 * @returns true if state is valid
 */
export function validateOAuthState(state: string, userId: string): boolean {
  if (!state || !userId) {
    return false;
  }

  // State format: userId_serviceName_timestamp_random
  const parts = state.split("_");
  if (parts.length < 2) {
    return false;
  }

  // Check if state starts with user ID
  return parts[0] === userId;
}

/**
 * Extract service name from state parameter
 * 
 * @param state - State parameter
 * @returns Service name if found
 */
export function extractServiceFromState(state: string): string | null {
  const parts = state.split("_");
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
}

