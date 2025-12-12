import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { getCurrentUserWithSubscription } from "@/lib/subscription";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { logError } from "@/lib/error-logger";

/**
 * POST /api/billing/payment-intent
 * 
 * Creates a SetupIntent for adding/updating a payment method.
 * Returns client_secret for Stripe Elements.
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

    // 3. Ensure Stripe customer exists
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      if (!user.email) {
        return error("User email is required to create a Stripe customer", { status: 400 });
      }

      if (!stripe) {
        return error("Stripe is not configured", { status: 500 });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripe_customer_id: customer.id,
        },
      });

      customerId = customer.id;
    }

    // 4. Create SetupIntent
    if (!stripe) {
      return error("Stripe is not configured", { status: 500 });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // For future payments (subscriptions)
      metadata: {
        userId,
      },
    });

    // 5. Return client_secret
    return success({
      clientSecret: setupIntent.client_secret,
    });
  } catch (err) {
    logError("app/api/billing/payment-intent", err);
    return error(
      "Failed to create payment setup. Please try again or contact support.",
      { status: 500 }
    );
  }
}

