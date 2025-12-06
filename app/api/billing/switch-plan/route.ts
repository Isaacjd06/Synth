import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * Map plan identifiers to Stripe price IDs (monthly)
 */
const PLAN_PRICE_MAP_MONTHLY: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || "",
  pro: process.env.STRIPE_PRO_PRICE_ID || "",
  agency: process.env.STRIPE_AGENCY_PRICE_ID || "",
};

/**
 * Map plan identifiers to Stripe price IDs (yearly)
 */
const PLAN_PRICE_MAP_YEARLY: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "",
  pro: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  agency: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID || "",
};

/**
 * POST /api/billing/switch-plan
 * 
 * Switches the user's subscription to a new plan.
 * 
 * Request body:
 * {
 *   "newPlan": "starter" | "pro" | "agency"
 * }
 * 
 * Note: Uses proration_behavior: "none" to avoid immediate charges.
 * Changes will apply from the next billing period to prevent double-charging.
 */
export async function POST(req: Request) {
  let userId: string | undefined;

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

    userId = session.user.id;

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

    // 2. Parse request body
    const body = await req.json();
    const { newPlan } = body;

    if (!newPlan) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PLAN",
          message: "newPlan is required",
        },
        { status: 400 }
      );
    }

    // 3. Map newPlan to Stripe price ID (monthly only)
    const newPlanPriceId = PLAN_PRICE_MAP_MONTHLY[newPlan];
    if (!newPlanPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${newPlan}. Must be one of: starter, pro, agency`,
        },
        { status: 400 }
      );
    }

    // 4. Find user, their stripeSubscriptionId, and stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_SUBSCRIPTION",
          message: "No active subscription found",
        },
        { status: 404 }
      );
    }

    // Check if plan is already the same
    if (user.plan === newPlanPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_ON_PLAN",
          message: "You are already on this plan",
        },
        { status: 400 }
      );
    }

    // 5. Fetch the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
      {
        expand: ["items.data.price"],
      }
    );

    // 6. Identify the existing subscription items
    // The first item is typically the main plan subscription item
    // Remaining items are subscription add-ons that must be preserved
    const planItem = subscription.items.data[0];

    if (!planItem) {
      return NextResponse.json(
        {
          success: false,
          code: "PLAN_ITEM_NOT_FOUND",
          message: "Plan item not found in subscription",
        },
        { status: 400 }
      );
    }

    // Preserve add-ons (all items after the first one)
    const addOnItems = subscription.items.data.slice(1);

    // 7. Update subscription with new plan while preserving add-ons
    // Using proration_behavior: "none" to avoid immediate charges
    // This means the plan change will take effect at the next billing period
    // This prevents double-charging users when switching plans
    const items: Stripe.SubscriptionUpdateParams.Item[] = [
      { id: planItem.id, price: newPlanPriceId }, // Update plan
      ...addOnItems.map(item => ({ id: item.id })), // Preserve add-ons
    ];

    const updatedSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items,
        proration_behavior: "none", // Changes apply from next billing period
      }
    );

    // 8. Extract renewal date from current_period_end
    const renewalAt = (updatedSubscription as any).current_period_end
      ? new Date((updatedSubscription as any).current_period_end * 1000)
      : null;

    // 9. Update Prisma with new plan and status
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: newPlanPriceId,
        subscriptionStatus: updatedSubscription.status,
        subscriptionRenewalAt: renewalAt,
      },
    });

    // 10. Return updated subscription details
    return NextResponse.json(
      {
        subscription_id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: newPlanPriceId,
        plan_name: newPlan,
        renewal_at: renewalAt?.toISOString() || null,
        current_period_end: (updatedSubscription as any).current_period_end
          ? new Date((updatedSubscription as any).current_period_end * 1000).toISOString()
          : null,
        message: "Plan change will take effect at the next billing period",
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("app/api/billing/switch-plan", error, {
      userId,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error.message && error.message.includes("Stripe")
        ? "Failed to switch plan. Please try again."
        : error.message || "Internal server error";

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
