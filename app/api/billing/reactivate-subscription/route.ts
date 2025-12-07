import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import Stripe from "stripe";

/**
 * POST /api/billing/reactivate-subscription
 * 
 * Reactivates a subscription that was scheduled to cancel at period end.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_ID_NOT_FOUND",
          message: "User ID not found",
        },
        { status: 400 }
      );
    }

    // 2. Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_SUBSCRIPTION",
          message: "No active subscription found",
        },
        { status: 404 }
      );
    }

    // 3. Check if subscription is scheduled to cancel
    if (user.subscriptionStatus !== "cancels_at_period_end" && 
        user.subscriptionStatus !== "canceled") {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_CANCELED",
          message: "Subscription is not scheduled for cancellation",
        },
        { status: 400 }
      );
    }

    // 4. Reactivate subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    ) as Stripe.Subscription & {
      current_period_end?: number;
    };

    // 5. Update user in database
    const renewalAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionRenewalAt: renewalAt,
        subscriptionEndsAt: null, // Clear cancellation date
      },
    });

    // 6. Log audit event
    await logAudit("subscription.reactivated", userId, {
      stripe_subscription_id: subscription.id,
      reactivated_at: new Date().toISOString(),
    });

    // 7. Emit event
    Events.emit("subscription:reactivated", {
      user_id: userId,
      subscription_id: subscription.id,
    });

    // 8. Return reactivated subscription
    return NextResponse.json(
      {
        success: true,
        subscription_id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        renewal_at: renewalAt?.toISOString() || null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/reactivate-subscription", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

