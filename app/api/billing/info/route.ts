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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePaymentMethodId: true,
        subscriptionStatus: true,
        plan: true,
        addOns: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
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
      subscription: Record<string, unknown> | null;
      payment_method: Record<string, unknown> | null;
      upcoming_invoice: Record<string, unknown> | null;
    } = {
      has_customer: !!user.stripeCustomerId,
      has_subscription: !!user.stripeSubscriptionId,
      has_payment_method: !!user.stripePaymentMethodId,
      subscription: null,
      payment_method: null,
      upcoming_invoice: null,
    };

    // 4. Get subscription details if exists
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        ) as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };

        response.subscription = {
          id: subscription.id,
          status: subscription.status,
          plan: user.plan,
          add_ons: user.addOns || [],
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
    if (user.stripePaymentMethodId) {
      try {
        const paymentMethod = await getPaymentMethod(
          user.stripePaymentMethodId,
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
    if (user.stripeCustomerId) {
      try {
        const upcomingInvoice = await getUpcomingInvoice(
          user.stripeCustomerId,
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
