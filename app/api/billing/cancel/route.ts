import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription } from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";

interface CancelSubscriptionRequestBody {
  cancel_at_period_end?: boolean;
  reason?: string;
  confirmation?: string; // User must type "UNSUBSCRIBE" to confirm
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await req.json() as CancelSubscriptionRequestBody;
    const { cancel_at_period_end = true, reason, confirmation } = body;

    // 3. Require "UNSUBSCRIBE" confirmation
    if (!confirmation || confirmation.trim() !== "UNSUBSCRIBE") {
      return NextResponse.json(
        {
          success: false,
          code: "CONFIRMATION_REQUIRED",
          message: 'You must type "UNSUBSCRIBE" to confirm cancellation',
        },
        { status: 400 }
      );
    }

    // 4. Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripe_subscription_id: true },
    });

    if (!user || !user.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // 5. Cancel subscription
    const canceledSubscription = await cancelSubscription(
      user.stripe_subscription_id,
      cancel_at_period_end,
    );

    // 6. Update user in database
    const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
    const stripeStatus = cancel_at_period_end ? "cancels_at_period_end" : "canceled";
    const updateData: {
      subscription_status: string;
      subscriptionStatus: import("@prisma/client").SubscriptionStatus;
      subscription_ends_at?: Date;
    } = {
      subscription_status: stripeStatus,
      subscriptionStatus: mapStripeStatusToSubscriptionStatus(stripeStatus),
    };

    if (!cancel_at_period_end) {
      updateData.subscription_ends_at = new Date();
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 7. Save cancellation reason if provided
    if (reason && typeof reason === "string" && reason.trim()) {
      await prisma.subscription_cancel_reasons.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          reason: reason.trim(),
        },
      });
    }

    // 8. Log audit event
    await logAudit("subscription.canceled", userId, {
      stripe_subscription_id: canceledSubscription.id,
      cancel_at_period_end,
      canceled_at: new Date().toISOString(),
      reason: reason || null,
    });

    // 9. Emit event
    Events.emit("subscription:canceled", {
      user_id: userId,
      subscription_id: canceledSubscription.id,
      cancel_at_period_end,
      reason: reason || null,
    });

    // 10. Return canceled subscription
    return NextResponse.json(
      {
        subscription_id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        canceled_at: canceledSubscription.canceled_at
          ? new Date(canceledSubscription.canceled_at * 1000)
          : null,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    logError("app/api/billing/cancel", error, {
      userId: (await auth())?.user?.id,
    });
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
