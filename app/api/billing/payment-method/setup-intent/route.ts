import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * POST /api/billing/payment-method/setup-intent
 * 
 * Creates a SetupIntent for collecting payment methods securely.
 * Uses Stripe's SetupIntent API with usage: "off_session" for future payments.
 * 
 * Security: Synth never receives raw card details - Stripe handles everything.
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

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripe_customer_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Ensure they have a stripe_customer_id (create if needed)
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is required to create a Stripe customer" },
          { status: 400 }
        );
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

    // 4. Create SetupIntent with usage: "off_session" for future payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // For future payments (subscriptions)
      metadata: {
        userId,
      },
    });

    // 5. Return ONLY the client_secret - no sensitive data
    return NextResponse.json(
      { clientSecret: setupIntent.client_secret },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/payment-method/setup-intent", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      { error: "Failed to create setup intent. Please try again." },
      { status: 500 }
    );
  }
}

