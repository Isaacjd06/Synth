import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { requireSubscriptionLevel, getCurrentUserWithSubscription } from "@/lib/subscription";
import { success, error } from "@/lib/api-response";
import { generateInsightsForUser } from "@/lib/insights-engine";
import { logError } from "@/lib/error-logger";
import type { InsightsResult } from "@/types/api";

/**
 * GET /api/insights/basic
 * 
 * Returns insights for the authenticated user.
 * FREE plan cannot access insights.
 */
export async function GET() {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    // 2. Check subscription level - FREE cannot access insights
    const planCheck = await requireSubscriptionLevel(userId, "starter");
    if (planCheck) {
      return planCheck; // Returns 403 with error message
    }

    // 3. Get user info (for future use if needed)
    const user = await getCurrentUserWithSubscription(userId);

    // 4. Generate insights using the insights engine
    const insights: InsightsResult = await generateInsightsForUser(userId);

    // 5. Return insights
    return success(insights);
  } catch (err) {
    logError("app/api/insights/basic", err);
    return error(
      "Failed to load insights. Please try again.",
      { status: 500 }
    );
  }
}

