import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { logError } from "@/lib/error-logger";
import { initiateOAuthFlow } from "@/lib/pipedream-oauth";

/**
 * POST /api/connections/start
 * 
 * Start an OAuth connection flow for a service.
 * Requires full access (paid or trial).
 * 
 * Body:
 * - serviceName: Name of the service to connect (e.g., "Slack", "Gmail")
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json();
    const { serviceName } = body;

    if (!serviceName) {
      return NextResponse.json(
        { error: "serviceName is required" },
        { status: 400 }
      );
    }

    // Get base URL for callback
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/connections/callback`;

    // Initiate OAuth flow
    const { authUrl, state } = await initiateOAuthFlow(
      serviceName,
      userId,
      redirectUri
    );

    return NextResponse.json(
      {
        ok: true,
        authUrl,
        state,
        serviceName,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/connections/start", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    // Check if it's a configuration error
    if (errorMessage.includes("not configured")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Connection service not available. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

