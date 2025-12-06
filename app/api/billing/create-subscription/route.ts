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
 * Map subscription add-on identifiers to Stripe price IDs
 * Note: These are recurring subscription add-ons (billed monthly with subscription)
 * One-time add-ons (rapid_booster, performance_turbo, etc.) should be purchased separately
 * via /api/billing/purchase-addon and are NOT included here
 */
const ADDON_PRICE_MAP: Record<string, string> = {
  extra_workflows: process.env.STRIPE_ADDON_EXTRA_WORKFLOWS_PRICE_ID || "",
  priority_support: process.env.STRIPE_ADDON_PRIORITY_SUPPORT_PRICE_ID || "",
  white_label: process.env.STRIPE_ADDON_WHITE_LABEL_PRICE_ID || "",
  // Add more recurring subscription add-ons as needed
};

/**
 * POST /api/billing/create-subscription
 * 
 * Creates a new subscription for the authenticated user.
 * 
 * Request body:
 * {
 *   "plan": "starter" | "pro" | "agency",
 *   "addons": string[]  // e.g. ["extra_workflows", "priority_support"]
 * }
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

    // 2. Parse request body
    const body = await req.json();
    const { plan, addons = [], coupon } = body;

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PLAN",
          message: "plan is required",
        },
        { status: 400 }
      );
    }

    // 3. Map plan string to Stripe price ID (monthly only)
    const planPriceId = PLAN_PRICE_MAP_MONTHLY[plan];
    if (!planPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${plan}. Must be one of: starter, pro, agency`,
        },
        { status: 400 }
      );
    }

    // 4. Look up user and their stripeCustomerId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
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

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_CUSTOMER",
          message: "Stripe customer not found. Please set up payment method first.",
        },
        { status: 400 }
      );
    }

    // 5. Build subscription items: plan + add-ons
    // Note: Add-ons are added as additional subscription items for recurring billing
    const items: Stripe.SubscriptionCreateParams.Item[] = [
      { price: planPriceId, quantity: 1 },
    ];

    // Map add-on identifiers to price IDs and add to subscription
    // Note: For subscription add-ons, we use recurring price IDs
    // For one-time add-ons, they should be purchased separately via purchase-addon
    const validAddonIds: string[] = [];
    for (const addonId of addons) {
      const addonPriceId = ADDON_PRICE_MAP[addonId];
      if (addonPriceId) {
        items.push({ price: addonPriceId, quantity: 1 });
        validAddonIds.push(addonId); // Store identifier, not price ID
      } else {
        // Log warning but don't fail - unknown add-ons are ignored
        console.warn(`Unknown add-on identifier: ${addonId}`);
      }
    }

    // 6. Create subscription via Stripe
    // Since we're using SetupIntent to save payment methods first,
    // the subscription should automatically charge the default payment method
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: user.stripeCustomerId,
      items,
      // Use default behavior: auto-charge the default payment method
      // Remove payment_behavior to use Stripe's default (error_if_incomplete)
      expand: ["latest_invoice.payment_intent"],
    };

    // Add coupon if provided
    if (coupon && typeof coupon === "string" && coupon.trim()) {
      subscriptionParams.discounts = [
        {
          coupon: coupon.trim(),
        },
      ];
    }

    // Add trial period if configured
    const trialDays = process.env.STRIPE_TRIAL_DAYS
      ? parseInt(process.env.STRIPE_TRIAL_DAYS, 10)
      : 0;
    
    if (trialDays > 0) {
      subscriptionParams.trial_period_days = trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // 7. Extract renewal date from current_period_end
    const renewalAt = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null;

    // 8. Save to Prisma using camelCase field names
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        plan: planPriceId,
        subscriptionStatus: subscription.status,
        subscriptionRenewalAt: renewalAt,
        addOns: validAddonIds, // Store add-on identifiers (consistent with purchase-addon)
      },
    });

    // 9. Return subscription details for frontend
    return NextResponse.json(
      {
        subscription_id: subscription.id,
        status: subscription.status,
        plan: planPriceId,
        plan_name: plan,
        addons: validAddonIds,
        renewal_at: renewalAt?.toISOString() || null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("app/api/billing/create-subscription", error, {
      userId: (await auth())?.user?.id,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error.message && error.message.includes("Stripe")
        ? "Failed to create subscription. Please try again."
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
