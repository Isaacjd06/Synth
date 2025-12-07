import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { getPipedreamConnectionDetails } from "@/lib/pipedream-connections";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/connections/details/[key]
 * Get detailed information about a specific Synth connection
 * 
 * Path Parameter:
 * - key: The connection key (e.g., "gmail", "slack")
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // Check authentication and subscription (full access required)
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { key: connectionKey } = await params;

    if (!connectionKey) {
      return NextResponse.json(
        { ok: false, error: "Connection key is required" },
        { status: 400 }
      );
    }

    try {
      const connection = await getPipedreamConnectionDetails(connectionKey);

      if (!connection) {
        return NextResponse.json(
          { ok: false, error: "Connection not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        connection,
      });
    } catch (error: unknown) {
      const err = error as Error;
      logError("app/api/connections/details (connection service error)", err, {
        userId,
        connectionKey,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to get connection details",
          message: "Unable to retrieve connection information. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logError("app/api/connections/details", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

