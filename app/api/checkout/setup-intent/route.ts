import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/checkout/setup-intent
 * 
 * Creates a SetupIntent for collecting payment method with PaymentElement.
 * This allows us to collect payment details without charging immediately.
 * 
 * Response:
 * {
 *   client_secret: "seti_xxx_secret_xxx"
 * }
 */
export async function POST(req: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error("Stripe is not configured. STRIPE_SECRET_KEY is missing.");
      return NextResponse.json(
        {
          error: "Payment system is not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Authenticate user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        {
          error: "Unauthorized. Please sign in to continue.",
        },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    if (!setupIntent.client_secret) {
      throw new Error("Failed to create SetupIntent: missing client_secret");
    }

    return NextResponse.json(
      {
        client_secret: setupIntent.client_secret,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("SETUP INTENT ERROR:", error);
    
    // Handle Stripe-specific errors
    const stripeError = error as { code?: string; type?: string; message?: string };
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to initialize payment form. Please try again.";
    
    if (stripeError.code === "resource_missing" || stripeError.type === "StripeInvalidRequestError") {
      // Customer doesn't exist - this should be handled by getOrCreateStripeCustomer
      // but if it still fails, provide a helpful message
      errorMessage = "Payment setup failed. Please refresh the page and try again.";
    } else if (error instanceof Error) {
      // Use the error message if it's user-friendly
      if (error.message.includes("User not found") || error.message.includes("Unauthorized")) {
        errorMessage = error.message;
      } else if (!error.message.includes("Stripe")) {
        // Only use non-Stripe error messages directly
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

