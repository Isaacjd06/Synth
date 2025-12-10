import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getUpcomingInvoice, getPaymentMethod } from "@/lib/billing";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripe_customer_id: true,
        stripe_subscription_id: true,
        stripe_payment_method_id: true,
        subscription_status: true,
        subscription_plan: true,
        pending_subscription_plan: true,
        subscription_add_ons: true,
        subscription_ends_at: true,
        trial_ends_at: true,
        payment_method_added_at: true,
        last_plan_change_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Build response object
    const response: {
      has_customer: boolean;
      has_subscription: boolean;
      has_payment_method: boolean;
      payment_method_added_at: string | null;
      last_plan_change_at: string | null;
      subscription: Record<string, unknown> | null;
      payment_method: Record<string, unknown> | null;
      upcoming_invoice: Record<string, unknown> | null;
    } = {
      has_customer: !!user.stripe_customer_id,
      has_subscription: !!user.stripe_subscription_id,
      has_payment_method: !!user.stripe_payment_method_id,
      payment_method_added_at: user.payment_method_added_at?.toISOString() || null,
      last_plan_change_at: user.last_plan_change_at?.toISOString() || null,
      subscription: null,
      payment_method: null,
      upcoming_invoice: null,
    };

    // 4. Get subscription details if exists
    if (user.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripe_subscription_id,
        ) as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };

        response.subscription = {
          id: subscription.id,
          status: subscription.status,
          plan: user.subscription_plan, // Current active plan
          pending_plan: user.pending_subscription_plan || null, // Plan that will be active on next payment
          add_ons: user.subscription_add_ons || [],
          current_period_start: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
        };
      } catch (error: unknown) {
        console.error("Error fetching subscription:", error);
      }
    }

    // 5. Get payment method details if exists
    if (user.stripe_payment_method_id) {
      try {
        const paymentMethod = await getPaymentMethod(
          user.stripe_payment_method_id,
        );

        if (paymentMethod.card) {
          response.payment_method = {
            id: paymentMethod.id,
            type: paymentMethod.type,
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
          };
        }
      } catch (error: unknown) {
        console.error("Error fetching payment method:", error);
      }
    }

    // 6. Get upcoming invoice if customer exists
    if (user.stripe_customer_id) {
      try {
        const upcomingInvoice = await getUpcomingInvoice(
          user.stripe_customer_id,
        );

        if (upcomingInvoice) {
          response.upcoming_invoice = {
            amount_due: upcomingInvoice.amount_due,
            currency: upcomingInvoice.currency,
            period_start: upcomingInvoice.period_start
              ? new Date(upcomingInvoice.period_start * 1000)
              : null,
            period_end: upcomingInvoice.period_end
              ? new Date(upcomingInvoice.period_end * 1000)
              : null,
          };
        }
      } catch (error: unknown) {
        console.error("Error fetching upcoming invoice:", error);
      }
    }

    // 7. Return billing info
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    logError("app/api/billing/info", error, {
      userId: (await auth())?.user?.id,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
