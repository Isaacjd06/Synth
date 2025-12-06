import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachPaymentMethod } from "@/lib/billing";
import { logAudit } from "@/lib/audit";
import { logError } from "@/lib/error-logger";

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

    if (!payment_method_id) {
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
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_CUSTOMER",
          message: "Stripe customer not found",
        },
        { status: 404 }
      );
    }

    // 4. Attach payment method to customer
    await attachPaymentMethod(user.stripeCustomerId, payment_method_id);

    // 5. Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: { stripePaymentMethodId: payment_method_id },
    });

    // 6. Log audit event
    await logAudit("payment_method.updated", userId, {
      payment_method_id,
    });

    // 7. Return success
    return NextResponse.json(
      { success: true, payment_method_id },
      { status: 200 },
    );
  } catch (error: any) {
    logError("app/api/billing/update-payment-method", error, {
      userId,
    });
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
