import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getUpcomingInvoice } from "@/lib/billing";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/billing/customer-info
 * 
 * Returns safe billing information for the authenticated user.
 * No sensitive payment data is included.
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

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripe_customer_id: true,
        stripe_subscription_id: true,
        subscription_plan: true,
        pending_subscription_plan: true,
        subscription_status: true,
        subscription_renewal_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3. Build response with safe information only
    const response: {
      current_plan: string | null;
      next_plan: string | null;
      subscription_status: string | null;
      upcoming_invoice_date: string | null;
      invoice_amount_due: number | null;
      renewal_date: string | null;
    } = {
      current_plan: user.subscription_plan || null,
      next_plan: user.pending_subscription_plan || null,
      subscription_status: user.subscription_status || null,
      upcoming_invoice_date: null,
      invoice_amount_due: null,
      renewal_date: user.subscription_renewal_at?.toISOString() || null,
    };

    // 4. Get upcoming invoice if customer exists
    if (user.stripe_customer_id) {
      try {
        const upcomingInvoice = await getUpcomingInvoice(user.stripe_customer_id);

        if (upcomingInvoice) {
          response.upcoming_invoice_date = upcomingInvoice.period_end
            ? new Date(upcomingInvoice.period_end * 1000).toISOString()
            : null;
          response.invoice_amount_due = upcomingInvoice.amount_due
            ? upcomingInvoice.amount_due / 100 // Convert from cents to dollars
            : null;
        }
      } catch (error: unknown) {
        // Log but don't fail - invoice might not exist
        console.error("Error fetching upcoming invoice:", error);
      }
    }

    // 5. Return safe billing information
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    logError("app/api/billing/customer-info", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

