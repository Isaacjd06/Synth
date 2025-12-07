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

interface SwitchPlanRequestBody {
  newPlan: string;
  billingPeriod?: "monthly" | "yearly"; // Optional: defaults to "monthly" for backward compatibility
}

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
    const body = await req.json() as SwitchPlanRequestBody;
    const { newPlan, billingPeriod = "monthly" } = body;

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

    // Validate billing period
    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_BILLING_PERIOD",
          message: "billingPeriod must be 'monthly' or 'yearly'",
        },
        { status: 400 }
      );
    }

    // 3. Map newPlan to Stripe price ID based on billing period
    const priceMap = billingPeriod === "yearly" ? PLAN_PRICE_MAP_YEARLY : PLAN_PRICE_MAP_MONTHLY;
    const newPlanPriceId = priceMap[newPlan];
    
    if (!newPlanPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${newPlan}. Must be one of: starter, pro, agency. ` +
            `Also check if ${billingPeriod} billing is configured for this plan.`,
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
    // Note: user.plan now stores plan name (e.g., "pro"), not price ID
    if (user.plan === newPlan) {
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
    // The first item is the main plan subscription item
    // Note: Add-ons are NOT part of subscriptions - they are one-time purchases only
    // Only plans (starter, pro, agency) support yearly billing
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

    // Check for any additional items that shouldn't be there
    const additionalItems = subscription.items.data.slice(1);
    if (additionalItems.length > 0) {
      console.warn(
        `Found ${additionalItems.length} unexpected subscription items that will be removed. ` +
        `Add-ons should not be in subscriptions - they are one-time purchases only.`
      );
    }

    // 7. Update subscription with new plan only (remove any additional items)
    // Using proration_behavior: "none" to avoid immediate charges
    // This means the plan change will take effect at the next billing period
    // This prevents double-charging users when switching plans
    const items: Stripe.SubscriptionUpdateParams.Item[] = [
      { id: planItem.id, price: newPlanPriceId }, // Update plan
      // Remove any additional items by marking them as deleted
      ...additionalItems.map(item => ({ id: item.id, deleted: true })),
    ];

    const updatedSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items,
        proration_behavior: "none", // Changes apply from next billing period
      }
    ) as Stripe.Subscription & {
      current_period_end?: number;
    };

    // 8. Extract renewal date from current_period_end
    const renewalAt = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000)
      : null;

    // 9. Update Prisma with new plan and status
    // Store plan name (e.g., "pro", "starter", "agency") instead of price ID
    // This is needed for feature-gate.ts to work correctly
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: newPlan, // Store plan name instead of price ID
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
        billing_period: billingPeriod,
        renewal_at: renewalAt?.toISOString() || null,
        current_period_end: updatedSubscription.current_period_end
          ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
          : null,
        message: "Plan change will take effect at the next billing period",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/switch-plan", error, {
      userId,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error instanceof Error && error.message.includes("Stripe")
        ? "Failed to switch plan. Please try again."
        : error instanceof Error
        ? error.message
        : "Internal server error";

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
