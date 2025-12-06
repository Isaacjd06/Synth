import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/connections/callback
 * 
 * OAuth callback endpoint for completing Pipedream connection setup.
 * Requires full access (paid or trial).
 * 
 * Query params:
 * - code: OAuth authorization code
 * - state: State parameter (should contain userId)
 * - service: Service name
 */
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const service = searchParams.get("service");

    if (!code || !state || !service) {
      return NextResponse.json(
        { error: "Missing required parameters (code, state, service)" },
        { status: 400 }
      );
    }

    // Verify state matches authenticated user
    if (state !== userId) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // TODO: Complete OAuth flow with Pipedream
    // This would typically:
    // 1. Exchange authorization code for access token via Pipedream API
    // 2. Store connection reference in database
    // 3. Link to Pipedream source/auth ID
    
    const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
    
    if (!PIPEDREAM_API_KEY) {
      return NextResponse.json(
        { error: "Pipedream API key not configured" },
        { status: 500 }
      );
    }

    // Placeholder: In a real implementation, you would:
    // 1. Exchange code for token with Pipedream
    // 2. Get source/auth ID from Pipedream
    // 3. Create Connection record with pipedream_source_id and pipedream_auth_id
    
    // Example structure (needs to be implemented based on Pipedream API):
    // const tokenResponse = await fetch(`${PIPEDREAM_API_URL}/oauth/token`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ code, service }),
    // });
    // const { access_token, source_id, auth_id } = await tokenResponse.json();

    // For now, create a connection record (without Pipedream IDs)
    const connection = await prisma.connection.create({
      data: {
        user_id: userId,
        service_name: service,
        status: "active",
        connection_type: "OAuth",
        // pipedream_source_id: source_id, // TODO: Set from Pipedream response
        // pipedream_auth_id: auth_id, // TODO: Set from Pipedream response
        last_verified: new Date(),
      },
    });

    // Log audit event
    await logAudit("connection.create", userId, {
      connection_id: connection.id,
      service_name: service,
      connection_type: "OAuth",
    });

    // Redirect to connections page or return success
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/connections?connected=${service}`);
  } catch (error: unknown) {
    logError("app/api/connections/callback", error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/connections?error=connection_failed`);
  }
}

