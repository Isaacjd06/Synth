/**
 * Lightweight error logging utility.
 * Logs errors with timestamp, location, error details, and optional metadata.
 *
 * @param location - The file/function where the error occurred (e.g., "app/api/workflows/create")
 * @param error - The error object or error message
 * @param metadata - Optional metadata object to include in the log
 */
export function logError(location: string, error: any, metadata?: any): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error?.message || error?.toString() || String(error);
  const errorStack = error?.stack || null;

  console.error(`[${timestamp}] ERROR [${location}]`, {
    error: errorMessage,
    stack: errorStack,
    metadata: metadata || null,
  });
}
