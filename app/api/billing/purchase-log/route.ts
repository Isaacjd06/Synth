import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/billing/purchase-log
 * 
 * Returns the purchase history for add-ons for the authenticated user.
 */
export async function GET(req: Request) {
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

    // 2. Fetch purchase logs for the user
    const purchaseLogs = await prisma.purchaseLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        addonId: true,
        stripePaymentIntentId: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    // 3. Return purchase logs
    return NextResponse.json(
      {
        success: true,
        purchases: purchaseLogs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logError("app/api/billing/purchase-log", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to fetch purchase history",
      },
      { status: 500 }
    );
  }
}

