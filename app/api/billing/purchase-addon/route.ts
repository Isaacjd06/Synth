import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { requireActiveSubscription } from "@/lib/auth-helpers";
import Stripe from "stripe";

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

interface PurchaseAddonRequestBody {
  addon: string;
}

/**
 * POST /api/billing/purchase-addon
 *
 * Purchases a one-time add-on for the authenticated user.
 * Charges the customer's default payment method immediately.
 *
 * Request body:
 * {
 *   "addon": "rapid_booster" | "performance_turbo" | "business_jumpstart" | "persona_training" | "unlimited_knowledge"
 * }
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 400 }
      );
    }

    // 2. Parse request body
    const body = await req.json() as PurchaseAddonRequestBody;
    const { addon } = body;

    if (!addon) {
      return NextResponse.json(
        { error: "addon is required" },
        { status: 400 }
      );
    }

    // 3. Map addon identifier to price ID and name
    const addonInfo = ADDON_MAP[addon];
    if (!addonInfo || !addonInfo.priceId) {
      return NextResponse.json(
        { error: `Invalid add-on: ${addon}` },
        { status: 400 }
      );
    }

    // 4. Fetch user from DB and ensure stripeCustomerId exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        addOns: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer not found. Please set up payment method first." },
        { status: 400 }
      );
    }

    // CRITICAL: Add-ons can ONLY be purchased with the first subscription payment.
    // If user already has a subscription (any status), they CANNOT purchase addons.
    if (user.stripeSubscriptionId) {
      return NextResponse.json(
        {
          success: false,
          code: "ADDONS_REQUIRE_NEW_SUBSCRIPTION",
          message: "Add-ons can only be purchased with the first subscription payment. You already have a subscription.",
        },
        { status: 400 }
      );
    }

    // Check if addon is already owned
    if (user.addOns.includes(addon)) {
      return NextResponse.json(
        {
          success: false,
          code: "ADDON_ALREADY_OWNED",
          message: "You already own this add-on",
        },
        { status: 409 }
      );
    }

    // 5. Fetch customer's default payment method from Stripe
    const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ["invoice_settings.default_payment_method"],
    });

    if (customer.deleted) {
      return NextResponse.json(
        { error: "Customer account not found" },
        { status: 404 }
      );
    }

    const defaultPaymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod)?.id;

    if (!defaultPaymentMethodId) {
      return NextResponse.json(
        { error: "No default payment method found. Please add a payment method first." },
        { status: 400 }
      );
    }

    // 6. Retrieve the price to get amount and currency
    const price = await stripe.prices.retrieve(addonInfo.priceId);

    if (!price.unit_amount) {
      return NextResponse.json(
        { error: "Invalid price configuration for this add-on" },
        { status: 500 }
      );
    }

    // 7. Create PaymentIntent with off_session and confirm immediately
    // This is the simplest approach for MVP - charges the saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: user.stripeCustomerId,
      payment_method: defaultPaymentMethodId,
      off_session: true, // Charge without customer being present
      confirm: true, // Confirm immediately
      description: `One-time purchase: ${addonInfo.name}`,
      metadata: {
        userId,
        addon,
        addon_name: addonInfo.name,
        type: "one_time_addon",
      },
    });

    // 8. Handle payment failures
    if (paymentIntent.status === "requires_action") {
      // Payment requires additional authentication (3D Secure, etc.)
      return NextResponse.json(
        {
          error: "Payment requires additional authentication. Please try again.",
          requires_action: true,
          client_secret: paymentIntent.client_secret,
        },
        { status: 402 }
      );
    }

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: `Payment failed with status: ${paymentIntent.status}`,
          status: paymentIntent.status,
        },
        { status: 402 }
      );
    }

    // 9. On successful payment, update user's addOns field in Prisma
    // Append the addon identifier if not already present
    const updatedAddOns = user.addOns.includes(addon)
      ? user.addOns
      : [...user.addOns, addon];

    await prisma.user.update({
      where: { id: userId },
      data: {
        addOns: updatedAddOns,
      },
    });

    // 10. Log the purchase
    await prisma.purchaseLog.create({
      data: {
        userId,
        addonId: addon,
        stripePaymentIntentId: paymentIntent.id,
        amount: price.unit_amount,
        currency: price.currency || "usd",
        status: "succeeded",
      },
    });

    // 11. Return success response
    return NextResponse.json(
      {
        success: true,
        addon,
        addon_name: addonInfo.name,
        payment_intent_id: paymentIntent.id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/purchase-addon", error, {
      userId: (await auth())?.user?.id,
    });

    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error && error.type === "StripeCardError") {
      return NextResponse.json(
        {
          success: false,
          code: "PAYMENT_FAILED",
          message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') ? error.message : "Your card was declined. Please try a different payment method.",
        },
        { status: 402 }
      );
    }

    if (error && typeof error === 'object' && 'type' in error && error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "Invalid payment request. Please check your payment method.",
        },
        { status: 400 }
      );
    }

    // Return safe error message without exposing internal details
    const errorMessage =
      error instanceof Error && error.message.includes("Stripe")
        ? "Failed to process payment. Please try again."
        : error instanceof Error ? error.message : "Internal server error";

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

