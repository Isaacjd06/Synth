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
 * ⚠️ IMPORTANT: Add-ons are ONE-TIME purchases only
 *
 * All add-ons (rapid_booster, performance_turbo, etc.) are ONE-TIME purchases
 * and must be purchased separately via /api/billing/purchase-addon.
 *
 * Add-ons are NOT part of subscriptions and do NOT have yearly billing options.
 * Only the three main plans (starter, pro, agency) support yearly billing.
 *
 * If you need recurring subscription add-ons in the future:
 * 1. Create recurring prices in Stripe Dashboard
 * 2. Add env vars: STRIPE_ADDON_EXTRA_WORKFLOWS_PRICE_ID, etc.
 * 3. Create a separate ADDON_PRICE_MAP for recurring add-ons
 * 4. Update the billing page to support selection
 */

interface CreateSubscriptionRequestBody {
  plan: string;
  coupon?: string;
  billingPeriod?: "monthly" | "yearly"; // Optional: defaults to "monthly" for backward compatibility
  // Note: addons parameter removed - add-ons are one-time purchases via /api/billing/purchase-addon
}

/**
 * POST /api/billing/create-subscription
 *
 * Creates a new subscription for the authenticated user.
 *
 * Request body:
 * {
 *   "plan": "starter" | "pro" | "agency",
 *   "billingPeriod": "monthly" | "yearly"  // Optional, defaults to "monthly"
 *   "coupon": string  // Optional coupon code
 * }
 * 
 * Note: Add-ons are NOT included in subscriptions. They are one-time purchases
 * via /api/billing/purchase-addon and do NOT have yearly billing options.
 * Only plans support yearly billing.
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
    const body = await req.json() as CreateSubscriptionRequestBody;
    const { plan, coupon, billingPeriod = "monthly" } = body;
    
    // Ignore addons if provided - they are one-time purchases only
    // This ensures add-ons are never added to subscriptions
    if ('addons' in body && Array.isArray(body.addons) && body.addons.length > 0) {
      console.warn("Add-ons provided in create-subscription request are ignored. Add-ons must be purchased separately via /api/billing/purchase-addon");
    }

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

    // 3. Map plan string to Stripe price ID based on billing period
    const priceMap = billingPeriod === "yearly" ? PLAN_PRICE_MAP_YEARLY : PLAN_PRICE_MAP_MONTHLY;
    const planPriceId = priceMap[plan];
    
    if (!planPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${plan}. Must be one of: starter, pro, agency. ` +
            `Also check if ${billingPeriod} billing is configured for this plan.`,
        },
        { status: 400 }
      );
    }

    // 4. Look up user and their stripe_customer_id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripe_customer_id: true,
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

    if (!user.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_CUSTOMER",
          message: "Stripe customer not found. Please set up payment method first.",
        },
        { status: 400 }
      );
    }

    // Check if user has a payment method
    const userWithPaymentMethod = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripe_payment_method_id: true },
    });

    if (!userWithPaymentMethod?.stripe_payment_method_id) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_PAYMENT_METHOD",
          message: "Please add a payment method before creating a subscription.",
        },
        { status: 400 }
      );
    }

    // 5. Build subscription items: plan only
    // Add-ons are NOT included in subscriptions - they are one-time purchases only
    // Only the three main plans (starter, pro, agency) support yearly billing
    const items: Stripe.SubscriptionCreateParams.Item[] = [
      { price: planPriceId, quantity: 1 },
    ];

    // 6. Create subscription via Stripe
    // Since we're using SetupIntent to save payment methods first,
    // the subscription should automatically charge the default payment method
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: user.stripe_customer_id,
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

    // Add 3-day free trial period
    // All new subscriptions get a 3-day free trial
    const TRIAL_DAYS = 3;
    subscriptionParams.trial_period_days = TRIAL_DAYS;

    const subscription = await stripe.subscriptions.create(subscriptionParams) as Stripe.Subscription & {
      current_period_end?: number;
      trial_end?: number;
    };

    // 7. Extract renewal date and trial end date
    const renewalAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    // 8. Save to Prisma using snake_case field names
    // Store plan name (e.g., "pro", "starter", "agency") instead of price ID
    // This is needed for feature-gate.ts to work correctly
    // Note: subscription_add_ons field is NOT updated here - add-ons are purchased separately
    // For new subscriptions, both current and pending plan are the same
    const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripe_subscription_id: subscription.id,
        subscription_plan: plan, // Store plan name (e.g., "pro") instead of price ID
        pending_subscription_plan: null, // No pending plan for new subscriptions
        subscription_status: subscription.status,
        subscriptionStatus: mapStripeStatusToSubscriptionStatus(subscription.status),
        subscription_renewal_at: renewalAt,
        trial_ends_at: trialEndsAt, // Store 3-day trial end date
        subscription_started_at: new Date(),
        // subscription_add_ons field is NOT updated - add-ons are one-time purchases via /api/billing/purchase-addon
      },
    });

    // 9. Return subscription details for frontend
    return NextResponse.json(
      {
        subscription_id: subscription.id,
        status: subscription.status,
        plan: planPriceId,
        plan_name: plan,
        billing_period: billingPeriod,
        renewal_at: renewalAt?.toISOString() || null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        // Note: addons field removed - add-ons are purchased separately
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/create-subscription", error, {
      userId: (await auth())?.user?.id,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error instanceof Error && error.message.includes("Stripe")
        ? "Failed to create subscription. Please try again."
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
