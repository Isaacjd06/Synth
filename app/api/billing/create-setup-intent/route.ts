import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * POST /api/billing/create-setup-intent
 * 
 * Creates a SetupIntent for the authenticated user's Stripe customer.
 * Used with Stripe Payment Element to collect payment methods.
 */
export async function POST(req: Request) {
  try {
    // 1. Ensure the user is authenticated
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
      // Create Stripe customer if it doesn't exist
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is required to create a Stripe customer" },
          { status: 400 }
        );
      }

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      // Save customer ID to user
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripe_customer_id: customer.id,
        },
      });

      customerId = customer.id;
    }

    // 4. Create SetupIntent for the Stripe customer
    // Use usage: "off_session" for future payments (subscriptions)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // For future payments
      metadata: {
        userId,
      },
    });

    // 5. Return the client_secret to the frontend
    return NextResponse.json(
      { clientSecret: setupIntent.client_secret },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/create-setup-intent", error, {
      userId: (await auth())?.user?.id,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error instanceof Error && error.message.includes("Stripe")
        ? "Failed to create setup intent. Please try again."
        : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
