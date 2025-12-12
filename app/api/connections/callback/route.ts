import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getCurrentUserWithSubscription } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";
import {
  exchangeCodeForToken,
  storeOAuthCredentials,
  validateOAuthState,
  extractServiceFromState,
} from "@/lib/pipedream-oauth";
import { requireIntegrationAccess } from "@/lib/integrations-plan";
import { success, error } from "@/lib/api-response";

/**
 * GET /api/connections/callback
 * 
 * OAuth callback endpoint for completing connection setup.
 * Requires full access (paid or trial).
 * 
 * Query params:
 * - code: OAuth authorization code
 * - state: State parameter (contains userId and service name)
 * - error: Error parameter (if OAuth flow was cancelled/denied)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Get user with subscription info
    const user = await getCurrentUserWithSubscription(userId);

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // 3. Handle OAuth errors (user denied access, etc.)
    if (error) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/app/connections?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/app/connections?error=${encodeURIComponent("Missing required parameters")}`
      );
    }

    // 4. Validate state parameter for CSRF protection
    if (!validateOAuthState(state, userId)) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/app/connections?error=${encodeURIComponent("Invalid state parameter")}`
      );
    }

    // 5. Extract service name from state
    const serviceName = extractServiceFromState(state);
    if (!serviceName) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/app/connections?error=${encodeURIComponent("Invalid state format")}`
      );
    }

    // 6. Double-check plan access before storing connection
    const isInTrial = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
    const effectivePlan = isInTrial 
      ? ("agency" as const)
      : (user.subscription_plan || "free");

    const accessCheck = requireIntegrationAccess(effectivePlan, serviceName);
    if (accessCheck) {
      logError("app/api/connections/callback (plan check failed)", new Error(accessCheck.error));
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/app/connections?error=${encodeURIComponent(accessCheck.error)}`
      );
    }

    // 7. Get redirect URI (must match the one used in initiation)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/connections/callback`;

    // 8. Exchange authorization code for access token via Pipedream
    const tokenData = await exchangeCodeForToken(serviceName, code, redirectUri);

    // 9. Store OAuth credentials securely (in Pipedream, not in our DB)
    await storeOAuthCredentials(userId, serviceName, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      sourceId: tokenData.sourceId,
      authId: tokenData.authId,
    });

    // 10. Store connection record in Neon
    // Use pipedream_auth_id as provider_id (Pipedream connection ID)
    const existingConnection = await prisma.connection.findFirst({
      where: {
        user_id: userId,
        service_name: serviceName,
      },
    });

    let connection;
    if (existingConnection) {
      // Update existing connection
      connection = await prisma.connection.update({
        where: { id: existingConnection.id },
        data: {
          status: "active",
          connection_type: "OAuth",
          pipedream_source_id: tokenData.sourceId || null,
          pipedream_auth_id: tokenData.authId || null, // This is the provider_id
          last_verified: new Date(),
        },
      });
    } else {
      // Create new connection record
      connection = await prisma.connection.create({
        data: {
          user_id: userId,
          service_name: serviceName,
          status: "active",
          connection_type: "OAuth",
          pipedream_source_id: tokenData.sourceId || null,
          pipedream_auth_id: tokenData.authId || null, // This is the provider_id
          last_verified: new Date(),
        },
      });
    }

    // 11. Log audit event
    await logAudit("connection.create", userId, {
      connection_id: connection.id,
      service_name: serviceName,
      connection_type: "OAuth",
    });

    // 12. Redirect to connections page with success message
    return NextResponse.redirect(
      `${baseUrl}/app/connections?connected=${encodeURIComponent(serviceName)}`
    );
  } catch (err: unknown) {
    logError("app/api/connections/callback", err);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const errorMessage = err instanceof Error ? err.message : "connection_failed";
    return NextResponse.redirect(
      `${baseUrl}/app/connections?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

