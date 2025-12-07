import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events with idempotency.
 * Currently handles:
 * - invoice.payment_failed: Updates subscription status to "past_due"
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    logError("app/api/webhooks/stripe (signature verification)", err);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Check for idempotency - ensure we haven't processed this event before
  const existingEvent = await prisma.webhookEventLog.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent && existingEvent.processed) {
    // Event already processed, return success
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Create or update event log
  await prisma.webhookEventLog.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
    },
    update: {
      eventType: event.type,
    },
  });

  try {
    // Handle the event
    switch (event.type) {
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription;
        };

        // Extract subscription ID - can be string or Subscription object
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : typeof invoice.subscription === "object" && invoice.subscription?.id
            ? invoice.subscription.id
            : undefined;

        if (subscriptionId) {
          // Find user by subscription ID
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            select: { id: true },
          });

          if (user) {
            // Update subscription status to past_due
            // This will revoke access (hasFullAccess will return false)
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: "past_due",
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription;
        };

        // Extract subscription ID - can be string or Subscription object
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : typeof invoice.subscription === "object" && invoice.subscription?.id
            ? invoice.subscription.id
            : undefined;

        if (subscriptionId) {
          // Find user by subscription ID
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            select: { id: true, subscriptionStatus: true },
          });

          if (user) {
            // Restore subscription status to active (or set to active if it was past_due)
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: "active",
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end?: number;
          current_period_start?: number;
        };

        // Find user by customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
          select: { id: true },
        });

        if (user) {
          const status = subscription.status;
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null;

          // Extract plan name from first subscription item (the plan)
          let planName: string | null = null;
          if (subscription.items?.data && subscription.items.data.length > 0) {
            const planPriceId = subscription.items.data[0].price.id;
            // Import the helper function to map price ID to plan name
            const { getPlanNameFromPriceId } = await import("@/lib/billing");
            planName = getPlanNameFromPriceId(planPriceId);
          }

          // Check for any additional subscription items that shouldn't be there
          // Add-ons are NOT part of subscriptions - they are one-time purchases only
          if (subscription.items?.data && subscription.items.data.length > 1) {
            console.warn(
              `Found ${subscription.items.data.length - 1} unexpected subscription items. ` +
              `Add-ons should not be in subscriptions - they are one-time purchases only.`
            );
          }

          // Note: We do NOT update the addOns field from subscription items
          // because add-ons should never be in subscriptions.
          // The addOns field is only updated via the /api/billing/purchase-addon endpoint.
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeSubscriptionId: subscription.id,
              plan: planName, // Store plan name (e.g., "pro", "starter", "agency") instead of price ID
              subscriptionStatus: status,
              trialEndsAt: trialEnd,
              subscriptionStartedAt: new Date(subscription.created * 1000),
              subscriptionEndsAt:
                subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
              // addOns field is NOT updated from subscriptions
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
          select: { id: true },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: "canceled",
              subscriptionEndsAt: new Date(),
            },
          });
        }
        break;
      }

      // Add more event handlers as needed
      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await prisma.webhookEventLog.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // Log error but don't mark as processed so it can be retried
    logError("app/api/webhooks/stripe (event processing)", error, {
      eventId: event.id,
      eventType: event.type,
    });

    await prisma.webhookEventLog.update({
      where: { stripeEventId: event.id },
      data: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: "Event processing failed" },
      { status: 500 }
    );
  }
}
