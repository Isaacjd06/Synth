/**
 * Safe fetch helpers that handle HTML error pages gracefully
 */

/**
 * Safely parse JSON from a response, handling HTML error pages
 */
export async function safeJsonParse<T = unknown>(
  response: Response
): Promise<T | null> {
  const contentType = response.headers.get("content-type");
  
  // If response is not JSON, return null
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response received:", {
      status: response.status,
      statusText: response.statusText,
      contentType,
      preview: text.substring(0, 200),
    });
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
}

/**
 * Safe fetch wrapper that handles errors and non-JSON responses
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number;
}> {
  try {
    const response = await fetch(url, options);
    const data = await safeJsonParse<T>(response);

    if (!response.ok) {
      return {
        ok: false,
        data: data,
        error: data && typeof data === "object" && "error" in data
          ? String(data.error)
          : `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data: data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    };
  }
}

