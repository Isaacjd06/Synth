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
        stripe_customer_id: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Check if user has Stripe customer ID and subscription ID
    // If they don't have a Stripe subscription, they're manually managed (for testing)
    // Skip syncing to allow manual database changes
    if (!user.stripe_customer_id || !user.stripe_subscription_id) {
      return NextResponse.json(
        {
          message: "User is manually managed (no Stripe subscription). Skipping sync to preserve manual changes.",
          subscription: null,
        },
        { status: 200 },
      );
    }

    // 4. Query Stripe for latest subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No subscriptions found, update user to inactive
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscription_status: "inactive",
          stripe_subscription_id: null,
          subscription_plan: null,
          subscription_started_at: null,
          subscription_ends_at: null,
          trial_ends_at: null,
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
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_plan: planName || undefined, // Store plan name instead of price ID
        subscription_started_at: currentPeriodStart,
        subscription_ends_at: currentPeriodEnd,
        trial_ends_at: trialEnd,
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
