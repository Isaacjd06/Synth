import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getOrCreateStripeCustomer, validatePlanAndAddons } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

interface CreateCheckoutSessionRequestBody {
  planId: string;
  addonIds?: string[];
}

/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for subscription with 3-day free trial and optional add-ons.
 *
 * Body:
 * - planId: Stripe price ID for the plan
 * - addonIds: Array of Stripe price IDs for add-ons (optional)
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const body = await req.json() as CreateCheckoutSessionRequestBody;
    const { planId, addonIds = [] } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Validate plan and add-ons
    const validation = validatePlanAndAddons(planId, addonIds);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Build line items for checkout session
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: planId,
        quantity: 1,
      },
    ];

    // Add add-ons
    for (const addonId of addonIds) {
      lineItems.push({
        price: addonId,
        quantity: 1,
      });
    }

    // Create checkout session with 3-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 3, // 3-day free trial
        metadata: {
          userId,
          addonIds: JSON.stringify(addonIds),
        },
      },
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      metadata: {
        userId,
        planId,
        addonIds: JSON.stringify(addonIds),
      },
    });

    return NextResponse.json(
      {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("STRIPE CHECKOUT SESSION ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

