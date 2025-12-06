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
    const { cancel_at_period_end = true, reason } = body;

    // 3. Get user's current subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // 4. Cancel subscription
    const canceledSubscription = await cancelSubscription(
      user.stripeSubscriptionId,
      cancel_at_period_end,
    );

    // 5. Update user in database
    const updateData: {
      subscriptionStatus: string;
      subscriptionEndsAt?: Date;
    } = {
      subscriptionStatus: cancel_at_period_end
        ? "cancels_at_period_end"
        : "canceled",
    };

    if (!cancel_at_period_end) {
      updateData.subscriptionEndsAt = new Date();
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 6. Save cancellation reason if provided
    if (reason && typeof reason === "string" && reason.trim()) {
      await prisma.subscriptionCancelReason.create({
        data: {
          userId,
          reason: reason.trim(),
        },
      });
    }

    // 7. Log audit event
    await logAudit("subscription.canceled", userId, {
      stripe_subscription_id: canceledSubscription.id,
      cancel_at_period_end,
      canceled_at: new Date().toISOString(),
      reason: reason || null,
    });

    // 8. Emit event
    Events.emit("subscription:canceled", {
      user_id: userId,
      subscription_id: canceledSubscription.id,
      cancel_at_period_end,
      reason: reason || null,
    });

    // 9. Return canceled subscription
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
        message: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
