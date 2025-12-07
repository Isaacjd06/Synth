import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Check if user has Stripe customer ID
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer found. Please create a subscription first.",
        },
        { status: 400 },
      );
    }

    // 4. Query Stripe for latest subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No subscriptions found, update user to inactive
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "inactive",
          stripeSubscriptionId: null,
          plan: null,
          subscriptionStartedAt: null,
          subscriptionEndsAt: null,
          trialEndsAt: null,
        },
      });

      return NextResponse.json(
        {
          message: "No active subscription found",
          subscription: null,
        },
        { status: 200 },
      );
    }

    const subscription = subscriptions.data[0] as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;
    // Use type assertion to access period properties
    const sub = subscription as Stripe.Subscription & {
      current_period_end?: number;
      current_period_start?: number;
    };
    const currentPeriodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;
    const currentPeriodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null;

    // Map price ID to plan name
    let planName: string | null = null;
    if (priceId) {
      const { getPlanNameFromPriceId } = await import("@/lib/billing");
      planName = getPlanNameFromPriceId(priceId);
    }

    // 5. Update user subscription fields
    // Store plan name (e.g., "pro", "starter", "agency") instead of price ID
    // This is needed for feature-gate.ts to work correctly
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        plan: planName || undefined, // Store plan name instead of price ID
        subscriptionStartedAt: currentPeriodStart,
        subscriptionEndsAt: currentPeriodEnd,
        trialEndsAt: trialEnd,
      },
    });

    // 6. Return latest subscription data
    return NextResponse.json(
      {
        message: "Subscription synced successfully",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: priceId,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          trial_end: trialEnd,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("STRIPE SYNC ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
