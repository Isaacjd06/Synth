import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * POST /api/billing/create-customer
 * 
 * Creates a Stripe customer for the authenticated user if one doesn't exist.
 * Returns the existing customer ID if the user already has one.
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
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Return existing customer ID if it exists
    if (user.stripeCustomerId) {
      return NextResponse.json(
        { stripeCustomerId: user.stripeCustomerId },
        { status: 200 }
      );
    }

    // 4. Create new Stripe customer
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

    // 5. Save stripeCustomerId to the user via Prisma
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    // 6. Return the customer ID
    return NextResponse.json(
      { stripeCustomerId: customer.id },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/create-customer", error, {
      userId: (await auth())?.user?.id,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error.message && error.message.includes("Stripe")
        ? "Failed to create customer. Please try again."
        : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

