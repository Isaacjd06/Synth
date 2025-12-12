import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getCurrentUserWithSubscription } from "@/lib/subscription";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * GET /api/billing/status
 * 
 * Returns comprehensive billing status for the authenticated user.
 * This is the single source of truth for UI subscription data.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // 2. Get user with subscription info
    const user = await getCurrentUserWithSubscription(userId);

    // 3. Fetch payment method details if customer exists
    let paymentMethodLast4: string | null = null;
    let paymentMethodBrand: string | null = null;

    if (user.stripe_customer_id && stripe) {
      try {
        const customer = await stripe.customers.retrieve(user.stripe_customer_id, {
          expand: ["invoice_settings.default_payment_method"],
        });

        if (!customer.deleted) {
          const defaultPaymentMethodId =
            typeof customer.invoice_settings?.default_payment_method === "string"
              ? customer.invoice_settings.default_payment_method
              : (customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod)?.id;

          if (defaultPaymentMethodId) {
            const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
            if (paymentMethod.type === "card" && paymentMethod.card) {
              paymentMethodLast4 = paymentMethod.card.last4;
              paymentMethodBrand = paymentMethod.card.brand;
            }
          }
        }
      } catch (err) {
        // Log but don't fail - payment method check is best effort
        logError("app/api/billing/status (payment method)", err);
      }
    }

    // 4. Determine billing period from subscription if it exists
    let billingPeriod: "monthly" | "yearly" | null = null;
    if (user.stripe_subscription_id && stripe) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
          expand: ["items.data.price"],
        });

        const planPriceId = subscription.items.data[0]?.price.id;
        if (planPriceId) {
          const { isYearlyPriceId } = await import("@/lib/billing");
          const isYearly = isYearlyPriceId(planPriceId);
          if (isYearly !== null) {
            billingPeriod = isYearly ? "yearly" : "monthly";
          }
        }
      } catch (err) {
        // Log but don't fail - billing period check is best effort
        logError("app/api/billing/status (billing period)", err);
      }
    }

    // 5. Build response
    const { SubscriptionStatus } = await import("@prisma/client");
    const subscriptionStatusValue: "SUBSCRIBED" | "UNSUBSCRIBED" = 
      user.subscriptionStatus === SubscriptionStatus.SUBSCRIBED 
        ? "SUBSCRIBED"
        : user.subscriptionStatus === SubscriptionStatus.UNSUBSCRIBED
        ? "UNSUBSCRIBED"
        : (user.subscription_status === "active" || user.subscription_status === "trialing" 
          ? "SUBSCRIBED" 
          : "UNSUBSCRIBED");

    const response = {
      current_plan: user.subscription_plan || null,
      next_plan: user.pending_subscription_plan || null,
      renewal_date: user.subscription_renewal_at
        ? user.subscription_renewal_at.toISOString()
        : null,
      trial_end: user.trial_ends_at
        ? user.trial_ends_at.toISOString()
        : null,
      payment_method_last4: paymentMethodLast4,
      payment_method_brand: paymentMethodBrand,
      subscription_status: subscriptionStatusValue,
      billing_period: billingPeriod,
      has_payment_method: user.has_active_payment_method || false,
      stripe_customer_id: user.stripe_customer_id || null,
      stripe_subscription_id: user.stripe_subscription_id || null,
    };

    return success(response);
  } catch (err) {
    logError("app/api/billing/status", err);
    return error(
      "Failed to load billing status. Please try again.",
      { status: 500 }
    );
  }
}

