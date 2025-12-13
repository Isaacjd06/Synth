import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getCurrentUserWithSubscription } from "@/lib/subscription";
import { logError } from "@/lib/error-logger";
import { initiateOAuthFlow } from "@/lib/pipedream-oauth";
import { prisma } from "@/lib/prisma";
import { requireIntegrationAccess } from "@/lib/integrations-plan";
import { success, error } from "@/lib/api-response";
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";

// Rate limit: 10 connection attempts per minute
const connectionStartLimiter = createRateLimiter("connection-start", 10, 60);

/**
 * GET /api/connections/start?service=xxxxx
 * 
 * Start an OAuth connection flow for a service.
 * Redirects user to provider's OAuth URL.
 * 
 * Query params:
 * - service: Name of the service to connect (e.g., "slack", "gmail")
 */
export async function GET(req: Request) {
  try {
    // 0. Check rate limit
    await rateLimitOrThrow(req, connectionStartLimiter);

    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Get user with subscription info
    const user = await getCurrentUserWithSubscription(userId);

    // 3. Get service from query params
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service");

    if (!service) {
      return error("Please select a service to connect", 400);
    }

    // 4. Check plan access
    // During trial, treat user as if they have agency plan (all integrations)
    const isInTrial = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
    const effectivePlan = isInTrial 
      ? ("agency" as const)
      : (user.subscription_plan || "free");

    const accessCheck = requireIntegrationAccess(effectivePlan, service);
    if (accessCheck) {
      return error(accessCheck.error, 403);
    }

    // 5. Get base URL for callback
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/connections/callback`;

    // 6. Initiate OAuth flow via Pipedream (no branding exposed)
    const { authUrl, state } = await initiateOAuthFlow(
      service,
      userId,
      redirectUri
    );

    // 7. Redirect user to provider's OAuth URL
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    // Handle rate limit errors specially
    if (err instanceof NextResponse && err.status === 429) {
      return err;
    }

    logError("app/api/connections/start", err);
    
    return error("Unable to start connection. Please try again or contact support.", 500);
  }
}

