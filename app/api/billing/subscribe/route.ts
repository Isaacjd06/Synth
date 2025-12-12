import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getCurrentUserWithSubscription } from "@/lib/subscription";
import { success, error } from "@/lib/api-response";
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
 * POST /api/billing/subscribe
 * 
 * Creates or updates a Stripe subscription.
 * - If user has no subscription: creates new subscription
 * - If user has subscription: switches plan (upgrade/downgrade)
 * 
 * Request body:
 * {
 *   "plan": "starter" | "pro" | "agency",
 *   "billingPeriod": "monthly" | "yearly" (optional, defaults to "monthly")
 * }
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Get user with subscription info
    const user = await getCurrentUserWithSubscription(userId);

    // 3. Parse request body
    const body = await req.json();
    const { plan, billingPeriod = "monthly" } = body;

    if (!plan) {
      return error("plan is required", { status: 400 });
    }

    if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
      return error("billingPeriod must be 'monthly' or 'yearly'", { status: 400 });
    }

    // 4. Map plan to Stripe price ID
    const priceMap = billingPeriod === "yearly" ? PLAN_PRICE_MAP_YEARLY : PLAN_PRICE_MAP_MONTHLY;
    const planPriceId = priceMap[plan];
    
    if (!planPriceId) {
      return error(`Invalid plan: ${plan}`, { status: 400 });
    }

    // 5. Ensure Stripe customer exists
    if (!user.stripe_customer_id) {
      if (!user.email) {
        return error("User email is required to create a Stripe customer", { status: 400 });
      }

      if (!stripe) {
        return error("Stripe is not configured", { status: 500 });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripe_customer_id: customer.id },
      });

      user.stripe_customer_id = customer.id;
    }

    // 6. Check if user has payment method
    if (!user.has_active_payment_method && !user.stripe_payment_method_id) {
      return error("Please add a payment method before subscribing", { status: 400 });
    }

    // 7. Handle subscription creation or update
    if (!user.stripe_subscription_id) {
      // Create new subscription
      if (!stripe) {
        return error("Stripe is not configured", { status: 500 });
      }

      const subscription = await stripe.subscriptions.create({
        customer: user.stripe_customer_id!,
        items: [{ price: planPriceId, quantity: 1 }],
        expand: ["latest_invoice.payment_intent"],
        trial_period_days: 3, // 3-day free trial
      });

      const renewalAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;

      const trialEndsAt = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null;

      const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripe_subscription_id: subscription.id,
          subscription_plan: plan,
          subscription_status: subscription.status,
          subscriptionStatus: mapStripeStatusToSubscriptionStatus(subscription.status),
          subscription_renewal_at: renewalAt,
          trial_ends_at: trialEndsAt,
          subscription_started_at: new Date(),
        },
      });

      return success({
        subscription_id: subscription.id,
        status: subscription.status,
        plan,
        billing_period: billingPeriod,
        renewal_at: renewalAt?.toISOString() || null,
        trial_end: trialEndsAt?.toISOString() || null,
      });
    } else {
      // Update existing subscription (switch plan)
      if (!stripe) {
        return error("Stripe is not configured", { status: 500 });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
        expand: ["items.data.price"],
      });

      const planItem = subscription.items.data[0];
      if (!planItem) {
        return error("Plan item not found in subscription", { status: 400 });
      }

      // Update subscription with new plan
      const updatedSubscription = await stripe.subscriptions.update(
        user.stripe_subscription_id,
        {
          items: [{ id: planItem.id, price: planPriceId }],
          proration_behavior: "none", // Changes apply from next billing period
        }
      );

      const renewalAt = updatedSubscription.current_period_end
        ? new Date(updatedSubscription.current_period_end * 1000)
        : null;

      const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
      await prisma.user.update({
        where: { id: userId },
        data: {
          pending_subscription_plan: plan, // Set as pending until payment succeeds
          last_plan_change_at: new Date(),
          subscription_status: updatedSubscription.status,
          subscriptionStatus: mapStripeStatusToSubscriptionStatus(updatedSubscription.status),
          subscription_renewal_at: renewalAt,
        },
      });

      return success({
        subscription_id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan,
        pending_plan: plan,
        billing_period: billingPeriod,
        renewal_at: renewalAt?.toISOString() || null,
        message: "Plan change is pending and will take effect when the next payment is processed.",
      });
    }
  } catch (err) {
    logError("app/api/billing/subscribe", err);
    return error(
      "Failed to process subscription. Please try again or contact support.",
      { status: 500 }
    );
  }
}

