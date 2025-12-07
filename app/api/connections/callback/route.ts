import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";
import {
  exchangeCodeForToken,
  storeOAuthCredentials,
  validateOAuthState,
  extractServiceFromState,
} from "@/lib/pipedream-oauth";

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
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors (user denied access, etc.)
    if (error) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/settings/connections?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing required parameters (code, state)" },
        { status: 400 }
      );
    }

    // Validate state parameter for CSRF protection
    if (!validateOAuthState(state, userId)) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Extract service name from state
    const serviceName = extractServiceFromState(state);
    if (!serviceName) {
      return NextResponse.json(
        { error: "Invalid state format" },
        { status: 400 }
      );
    }

    // Get redirect URI (must match the one used in initiation)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/connections/callback`;

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(serviceName, code, redirectUri);

    // Store OAuth credentials securely
    await storeOAuthCredentials(userId, serviceName, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      sourceId: tokenData.sourceId,
      authId: tokenData.authId,
    });

    // Check if connection already exists
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
          pipedream_auth_id: tokenData.authId || null,
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
          pipedream_auth_id: tokenData.authId || null,
          last_verified: new Date(),
        },
      });
    }

    // Log audit event
    await logAudit("connection.create", userId, {
      connection_id: connection.id,
      service_name: serviceName,
      connection_type: "OAuth",
    });

    // Redirect to connections page with success message
    return NextResponse.redirect(
      `${baseUrl}/settings/connections?connected=${encodeURIComponent(serviceName)}`
    );
  } catch (error: unknown) {
    logError("app/api/connections/callback", error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const errorMessage = error instanceof Error ? error.message : "connection_failed";
    return NextResponse.redirect(
      `${baseUrl}/settings/connections?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

