import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * GET /api/billing/state
 * 
 * Fetches the current billing state for the authenticated user.
 * Returns plan, subscription status, add-ons, and payment method information.
 */
export async function GET(req: Request) {
  try {
    // 1. Verify authentication
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

    // 2. Fetch user from Prisma with billing fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionRenewalAt: true,
        addOns: true,
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

    // 3. Check if user has a payment method (if they have a Stripe customer)
    let hasPaymentMethod = false;

    if (user.stripeCustomerId) {
      try {
        // Fetch Stripe customer to check for default payment method
        const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
          expand: ["invoice_settings.default_payment_method"],
        });

        if (!customer.deleted) {
          // Check if customer has a default payment method
          hasPaymentMethod = !!(
            customer.invoice_settings?.default_payment_method &&
            (typeof customer.invoice_settings.default_payment_method === "string" ||
              (customer.invoice_settings.default_payment_method as Stripe.PaymentMethod)?.id)
          );
        }
      } catch (error: unknown) {
        // Log error but don't fail the request - payment method check is best effort
        logError("app/api/billing/state (payment method check)", error, {
          userId,
          customerId: user.stripeCustomerId,
        });
        // Continue with hasPaymentMethod = false
      }
    }

    // 4. Build and return response
    const response = {
      plan: user.plan || null,
      subscriptionStatus: user.subscriptionStatus || null,
      subscriptionRenewalAt: user.subscriptionRenewalAt
        ? user.subscriptionRenewalAt.toISOString()
        : null,
      addOns: user.addOns || [],
      stripeCustomerId: user.stripeCustomerId || null,
      hasPaymentMethod,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    logError("app/api/billing/state", error, {
      userId: (await auth())?.user?.id,
    });

    // Return safe error message without exposing internal details
    const errorMessage =
      error.message && error.message.includes("Stripe")
        ? "Failed to fetch billing state. Please try again."
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

