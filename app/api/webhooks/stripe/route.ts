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
        const invoice = event.data.object as Stripe.Invoice;

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
        const invoice = event.data.object as Stripe.Invoice;

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
        const subscription = event.data.object as Stripe.Subscription;

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

          // Extract add-ons from subscription metadata or items
          const addonIds: string[] = [];
          if (subscription.items?.data) {
            // First item is the plan, rest are add-ons
            subscription.items.data.slice(1).forEach((item) => {
              if (item.price.id) {
                addonIds.push(item.price.id);
              }
            });
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: status,
              trialEndsAt: trialEnd,
              subscriptionStartedAt: new Date(subscription.created * 1000),
              subscriptionEndsAt:
                subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
              addOns: addonIds,
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
