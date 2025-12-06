/**
 * Lightweight error logging utility.
 * Logs errors with timestamp, location, error details, and optional metadata.
 *
 * @param location - The file/function where the error occurred (e.g., "app/api/workflows/create")
 * @param error - The error object or error message
 * @param metadata - Optional metadata object to include in the log
 */
export function logError(location: string, error: unknown, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const err = error as { message?: string; stack?: string; toString?: () => string };
  const errorMessage = err?.message || err?.toString?.() || String(error);
  const errorStack = err?.stack || null;

  console.error(`[${timestamp}] ERROR [${location}]`, {
    error: errorMessage,
    stack: errorStack,
    metadata: metadata || null,
  });
}
