/**
 * Runtime utility functions that are safe for Edge Runtime
 * These functions don't use Node.js-specific modules
 */

/**
 * Check if the app is running in development mode
 * Returns true if NODE_ENV is 'development' or if running on localhost
 */
export function isDevelopmentMode(hostname?: string): boolean {
  // Check NODE_ENV first (most reliable)
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Check if hostname is localhost or 127.0.0.1
  if (hostname) {
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname.startsWith("localhost:") ||
      hostname.startsWith("127.0.0.1:");
    if (isLocalhost) {
      return true;
    }
  }

  return false;
}

/**
 * Check if development authentication is enabled
 */
export function isDevAuthEnabled(): boolean {
  // Only enable in development mode or on localhost
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Can also check for localhost in environment
  const hostname = process.env.AUTH_URL || "";
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return true;
  }

  return false;
}
