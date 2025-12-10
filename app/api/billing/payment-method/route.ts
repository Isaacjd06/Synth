import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { attachPaymentMethod } from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/billing/payment-method
 * 
 * Retrieves the user's default payment method from Stripe.
 * Returns ONLY safe, non-sensitive information.
 * 
 * Security: Never returns card numbers, CVC, or full expiration dates.
 */
export async function GET(req: Request) {
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

    // 2. Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripe_customer_id: true,
        has_active_payment_method: true,
      },
    });

    if (!user || !user.stripe_customer_id) {
      return NextResponse.json(
        {
          hasPaymentMethod: false,
        },
        { status: 200 }
      );
    }

    // If database says no active payment method, return early
    if (!user.has_active_payment_method) {
      return NextResponse.json(
        {
          hasPaymentMethod: false,
        },
        { status: 200 }
      );
    }

    // 3. Fetch customer from Stripe to get default payment method
    const customer = await stripe.customers.retrieve(user.stripe_customer_id, {
      expand: ["invoice_settings.default_payment_method"],
    });

    const defaultPaymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method as { id?: string })?.id;

    if (!defaultPaymentMethodId) {
      return NextResponse.json(
        {
          hasPaymentMethod: false,
        },
        { status: 200 }
      );
    }

    // 4. Fetch payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

    // 5. Return ONLY safe fields - no sensitive data
    if (paymentMethod.type === "card" && paymentMethod.card) {
      return NextResponse.json(
        {
          hasPaymentMethod: true,
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          cardholder_name: paymentMethod.billing_details?.name || null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hasPaymentMethod: false,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/payment-method (GET)", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      { error: "Failed to retrieve payment method" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/payment-method
 * 
 * Saves a payment method to the user's Stripe customer.
 * This is called after Stripe Elements confirms the SetupIntent.
 * 
 * Security: Only receives payment method ID from Stripe - never raw card data.
 */
export async function POST(req: Request) {
  let userId: string | undefined;

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

    userId = session.user.id;

    // 2. Parse request body
    const body = await req.json();
    const { payment_method_id } = body;

    if (!payment_method_id || typeof payment_method_id !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PAYMENT_METHOD",
          message: "payment_method_id is required",
        },
        { status: 400 }
      );
    }

    // 3. Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripe_customer_id: true,
        stripe_payment_method_id: true,
        payment_method_added_at: true,
      },
    });

    if (!user || !user.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_CUSTOMER",
          message: "Stripe customer not found",
        },
        { status: 404 }
      );
    }

    // 4. Detach old payment method if it exists
    if (user.stripe_payment_method_id && user.stripe_payment_method_id !== payment_method_id) {
      try {
        await stripe.paymentMethods.detach(user.stripe_payment_method_id);
      } catch (error) {
        // Log but don't fail - old PM might already be detached
        console.warn("Failed to detach old payment method:", error);
      }
    }

    // 5. Attach new payment method to customer and set as default
    await attachPaymentMethod(user.stripe_customer_id, payment_method_id);

    // 6. Check if this is the first time adding a payment method
    const isFirstPaymentMethod = !user.stripe_payment_method_id;

    // 7. Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripe_payment_method_id: payment_method_id,
        has_active_payment_method: true,
        // Set payment_method_added_at only if this is the first time
        ...(isFirstPaymentMethod && { payment_method_added_at: new Date() }),
      },
    });

    // 8. Log audit event (without sensitive data)
    await logAudit("payment_method.updated", userId, {
      action: isFirstPaymentMethod ? "added" : "updated",
      // DO NOT log payment_method_id for security
    });

    // 9. Return success
    return NextResponse.json(
      {
        success: true,
        message: isFirstPaymentMethod ? "Payment method added successfully" : "Payment method updated successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/payment-method (POST)", error, {
      userId,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/payment-method
 * 
 * Removes all payment methods from the user's Stripe customer.
 * 
 * Security: Only detaches payment methods - never accesses card data.
 */
export async function DELETE(req: Request) {
  let userId: string | undefined;

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

    userId = session.user.id;

    // 2. Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripe_customer_id: true,
        stripe_payment_method_id: true,
      },
    });

    if (!user || !user.stripe_customer_id) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_CUSTOMER",
          message: "Stripe customer not found",
        },
        { status: 404 }
      );
    }

    // 3. Fetch all payment methods attached to the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: "card",
    });

    // 4. Detach all payment methods
    for (const pm of paymentMethods.data) {
      try {
        await stripe.paymentMethods.detach(pm.id);
      } catch (error) {
        // Log but continue - some PMs might already be detached
        console.warn(`Failed to detach payment method ${pm.id}:`, error);
      }
    }

    // 5. Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripe_payment_method_id: null,
        has_active_payment_method: false,
      },
    });

    // 6. Log audit event
    await logAudit("payment_method.removed", userId, {
      // DO NOT log payment method IDs
    });

    // 7. Return success
    return NextResponse.json(
      {
        success: true,
        message: "Payment method removed successfully",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/payment-method (DELETE)", error, {
      userId,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

