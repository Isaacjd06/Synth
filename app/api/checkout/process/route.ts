import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getOrCreateStripeCustomer, attachPaymentMethod, createSubscription } from "@/lib/billing";
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
 * Map add-on identifiers to Stripe price IDs and human-readable names
 */
const ADDON_MAP: Record<
  string,
  { priceId: string; name: string }
> = {
  rapid_booster: {
    priceId: process.env.STRIPE_ADDON_RAPID_AUTOMATION_BOOSTER_PRICE_ID || "",
    name: "Rapid Automation Booster",
  },
  performance_turbo: {
    priceId: process.env.STRIPE_ADDON_WORKFLOW_PERFORMANCE_TURBO_PRICE_ID || "",
    name: "Workflow Performance Turbo",
  },
  business_jumpstart: {
    priceId: process.env.STRIPE_ADDON_BUSINESS_SYSTEMS_JUMPSTART_PRICE_ID || "",
    name: "Business Systems Jumpstart",
  },
  persona_training: {
    priceId: process.env.STRIPE_ADDON_AI_PERSONA_TRAINING_PRICE_ID || "",
    name: "AI Persona Training",
  },
  unlimited_knowledge: {
    priceId: process.env.STRIPE_ADDON_UNLIMITED_KNOWLEDGE_INJECTION_PRICE_ID || "",
    name: "Unlimited Knowledge Injection",
  },
};

interface ProcessPaymentRequest {
  plan: string;
  addons?: string[];
  paymentMethodId: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

/**
 * POST /api/checkout/process
 * 
 * Processes the checkout payment:
 * 1. Creates/gets Stripe customer
 * 2. Attaches payment method to customer
 * 3. Creates subscription (recurring monthly)
 * 4. Charges addons as one-time payment (only on first subscription payment)
 * 5. Updates user record with subscription and addon info
 * 
 * Important: Addons can only be purchased with the first subscription payment.
 * They are one-time purchases that get added to the subscription total.
 * 
 * Request body:
 * {
 *   "plan": "starter" | "pro" | "agency",
 *   "addons": ["rapid_booster", "performance_turbo", ...], // Optional
 *   "paymentMethodId": "pm_xxx",
 *   "billingDetails": { ... } // Optional billing details
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   subscription_id: "sub_xxx",
 *   payment_intent_id: "pi_xxx", // For addon payment
 *   plan: "starter",
 *   addons: ["rapid_booster", ...],
 *   total_charged: 5000, // Total in cents
 *   currency: "usd"
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
    const body = await req.json() as ProcessPaymentRequest;
    const { plan, addons = [], paymentMethodId, billingDetails } = body;

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

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PAYMENT_METHOD",
          message: "paymentMethodId is required",
        },
        { status: 400 }
      );
    }

    // 3. Validate plan
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

    // 4. Check if user already has an active subscription
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        addOns: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // If user already has a subscription (any status), addons cannot be purchased
    // Addons can only be purchased with the first subscription payment
    // Also, if they have an existing subscription, they should use switch-plan endpoint instead
    if (existingUser.stripeSubscriptionId) {
      // Check if they're trying to purchase addons with existing subscription
      if (addons.length > 0) {
        return NextResponse.json(
          {
            success: false,
            code: "ADDONS_REQUIRE_NEW_SUBSCRIPTION",
            message: "Add-ons can only be purchased with the first subscription payment. You already have a subscription.",
          },
          { status: 400 }
        );
      }
      
      // If they have a subscription and no addons, they should use switch-plan endpoint
      return NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_EXISTS",
          message: "You already have a subscription. Please use the switch-plan endpoint to change your plan.",
        },
        { status: 400 }
      );
    }

    // 5. Validate addons
    const addonPriceIds: string[] = [];
    const addonDetails: Array<{ id: string; priceId: string; name: string; amount: number }> = [];

    for (const addonId of addons) {
      const addonInfo = ADDON_MAP[addonId];
      if (!addonInfo || !addonInfo.priceId) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_ADDON",
            message: `Invalid add-on: ${addonId}`,
          },
          { status: 400 }
        );
      }

      // Check if addon is already owned
      if (existingUser.addOns.includes(addonId)) {
        return NextResponse.json(
          {
            success: false,
            code: "ADDON_ALREADY_OWNED",
            message: `You already own the add-on: ${addonId}`,
          },
          { status: 409 }
        );
      }

      addonPriceIds.push(addonInfo.priceId);

      // Get addon price details
      const addonPrice = await stripe.prices.retrieve(addonInfo.priceId);
      addonDetails.push({
        id: addonId,
        priceId: addonInfo.priceId,
        name: addonInfo.name,
        amount: addonPrice.unit_amount || 0,
      });
    }

    // 6. Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    // 7. Attach payment method to customer and set as default
    await attachPaymentMethod(customerId, paymentMethodId);

    // Update billing details if provided
    if (billingDetails) {
      await stripe.customers.update(customerId, {
        name: billingDetails.name,
        email: billingDetails.email,
        phone: billingDetails.phone,
        address: billingDetails.address,
      });
    }

    // 8. Create subscription (recurring monthly)
    // Addons are NOT part of the subscription - they are one-time purchases
    let subscription: Stripe.Subscription;
    try {
      subscription = await createSubscription(planPriceId, customerId, 3); // 3-day trial
    } catch (subscriptionError) {
      // If subscription creation fails, don't charge for addons
      logError("app/api/checkout/process (subscription creation failed)", subscriptionError, {
        userId,
        planPriceId,
        customerId,
      });
      return NextResponse.json(
        {
          success: false,
          code: "SUBSCRIPTION_CREATION_FAILED",
          message: "Failed to create subscription. Please try again.",
        },
        { status: 500 }
      );
    }

    // 9. Get plan price details (cache for later use)
    const planPrice = await stripe.prices.retrieve(planPriceId);
    const planAmount = planPrice.unit_amount || 0;
    const currency = planPrice.currency || "usd";

    // 10. Calculate addon total
    const addonTotal = addonDetails.reduce((sum, addon) => sum + addon.amount, 0);

    // 11. Charge addons as one-time payment if any
    let paymentIntent: Stripe.PaymentIntent | null = null;
    if (addons.length > 0 && addonTotal > 0) {

      // Create PaymentIntent for addons (one-time charge)
      paymentIntent = await stripe.paymentIntents.create({
        amount: addonTotal,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        description: `One-time add-ons purchase: ${addons.join(", ")}`,
        metadata: {
          userId,
          type: "checkout_addons",
          addons: addons.join(","),
          subscription_id: subscription.id,
        },
      });

      // Check if payment requires action (3D Secure, etc.)
      if (paymentIntent.status === "requires_action") {
        return NextResponse.json(
          {
            success: false,
            code: "PAYMENT_REQUIRES_ACTION",
            message: "Payment requires additional authentication",
            requires_action: true,
            client_secret: paymentIntent.client_secret,
          },
          { status: 402 }
        );
      }

      // Check if payment failed
      if (paymentIntent.status !== "succeeded") {
        // Cancel the subscription if addon payment failed
        try {
          await stripe.subscriptions.cancel(subscription.id);
        } catch (cancelError) {
          console.error("Failed to cancel subscription after addon payment failure:", cancelError);
        }

        return NextResponse.json(
          {
            success: false,
            code: "PAYMENT_FAILED",
            message: `Add-on payment failed with status: ${paymentIntent.status}`,
            payment_status: paymentIntent.status,
          },
          { status: 402 }
        );
      }
    }

    // 12. Update user record with subscription and addons
    const currentPeriodEnd = (subscription as { current_period_end?: number }).current_period_end;
    const renewalAt = currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : null;

    const trialEnd = (subscription as { trial_end?: number }).trial_end;
    const trialEndsAt = trialEnd
      ? new Date(trialEnd * 1000)
      : null;

    // Combine existing addons with new ones
    const updatedAddOns = [...new Set([...existingUser.addOns, ...addons])];

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        plan: plan,
        subscriptionStatus: subscription.status,
        subscriptionRenewalAt: renewalAt,
        trialEndsAt: trialEndsAt,
        subscriptionStartedAt: new Date(),
        subscriptionEndsAt: renewalAt,
        addOns: updatedAddOns,
        stripePaymentMethodId: paymentMethodId,
      },
    });

    // 13. Log addon purchases
    if (addons.length > 0 && paymentIntent) {
      for (const addonDetail of addonDetails) {
        await prisma.purchaseLog.create({
          data: {
            userId,
            addonId: addonDetail.id,
            stripePaymentIntentId: paymentIntent.id,
            amount: addonDetail.amount,
            currency: currency,
            status: "succeeded",
          },
        });
      }
    }

    // 14. Calculate total charged
    const totalCharged = planAmount + addonTotal;

    // 15. Return success response
    return NextResponse.json(
      {
        success: true,
        subscription_id: subscription.id,
        payment_intent_id: paymentIntent?.id || null,
        plan: plan,
        addons: addons,
        total_charged: totalCharged,
        currency: currency,
        subscription_status: subscription.status,
        renewal_at: renewalAt?.toISOString() || null,
        trial_end: trialEndsAt?.toISOString() || null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/checkout/process", error, {
      userId: (await auth())?.user?.id,
    });

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message?: string; code?: string };
      
      if (stripeError.type === "StripeCardError") {
        return NextResponse.json(
          {
            success: false,
            code: "PAYMENT_FAILED",
            message: stripeError.message || "Your card was declined. Please try a different payment method.",
          },
          { status: 402 }
        );
      }

      if (stripeError.type === "StripeInvalidRequestError") {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_REQUEST",
            message: stripeError.message || "Invalid payment request. Please check your payment method.",
          },
          { status: 400 }
        );
      }
    }

    // Return safe error message
    const errorMessage =
      error instanceof Error && error.message.includes("Stripe")
        ? "Failed to process payment. Please try again."
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

