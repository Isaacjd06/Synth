import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { searchPipedreamConnections, getPopularConnections } from "@/lib/pipedream-connections";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/connections/search
 * Search for available Synth connections
 * 
 * Query Parameters:
 * - q: Search query string
 * - category: Filter by category
 * - limit: Maximum results (default: 50)
 * - offset: Pagination offset (default: 0)
 * - popular: If true, return popular connections instead of searching
 */
export async function GET(req: Request) {
  try {
    // Check authentication and subscription (full access required to connect)
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("q") || undefined;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const popular = searchParams.get("popular") === "true";

    try {
      if (popular) {
        // Return popular/recommended connections
        const connections = await getPopularConnections(limit);
        return NextResponse.json({
          ok: true,
          connections,
          total: connections.length,
        });
      } else {
        // Search connections
        const result = await searchPipedreamConnections(searchQuery, category, limit, offset);
        return NextResponse.json({
          ok: true,
          connections: result.connections,
          total: result.total,
          limit,
          offset,
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      logError("app/api/connections/search (connection service error)", err, {
        userId,
        searchQuery,
        category,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to search connections",
          message: "Unable to retrieve available connections. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logError("app/api/connections/search", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

