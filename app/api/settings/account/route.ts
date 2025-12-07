import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { getUserAccessLevel } from "@/lib/access-control";

/**
 * GET /api/settings/account
 * 
 * Get comprehensive account information including subscription details.
 * Requires authentication.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        email_verified: true,
        created_at: true,
        last_login_at: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        subscriptionRenewalAt: true,
        trialEndsAt: true,
        addOns: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get access level information
    const accessInfo = await getUserAccessLevel(userId);

    // Get connection count
    const connectionCount = await prisma.connection.count({
      where: { user_id: userId },
    });

    // Get workflow count
    const workflowCount = await prisma.workflows.count({
      where: { user_id: userId },
    });

    // Get execution count
    const executionCount = await prisma.execution.count({
      where: { user_id: userId },
    });

    return NextResponse.json({
      ok: true,
      account: {
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        },
        subscription: {
          plan: user.plan || "free",
          status: user.subscriptionStatus || "inactive",
          startedAt: user.subscriptionStartedAt,
          endsAt: user.subscriptionEndsAt,
          renewalAt: user.subscriptionRenewalAt,
          trialEndsAt: user.trialEndsAt,
          addOns: user.addOns || [],
          hasCustomerId: !!user.stripeCustomerId,
        },
        access: {
          level: accessInfo.accessLevel,
          hasFullAccess: accessInfo.hasFullAccess,
          hasMinimalAccess: accessInfo.hasMinimalAccess,
          isInTrial: accessInfo.isInTrial,
        },
        stats: {
          connections: connectionCount,
          workflows: workflowCount,
          executions: executionCount,
        },
      },
    });
  } catch (error: unknown) {
    logError("app/api/settings/account", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

