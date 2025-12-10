import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
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
  const existingEvent = await prisma.webhook_event_logs.findUnique({
    where: { stripe_event_id: event.id },
  });

  if (existingEvent && existingEvent.processed) {
    // Event already processed, return success
    return NextResponse.json({ received: true, already_processed: true });
  }

  // Create or update event log
  await prisma.webhook_event_logs.upsert({
    where: { stripe_event_id: event.id },
    create: {
      stripe_event_id: event.id,
      event_type: event.type,
      processed: false,
    },
    update: {
      event_type: event.type,
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
            where: { stripe_subscription_id: subscriptionId },
            select: { 
              id: true,
              pending_subscription_plan: true,
            },
          });

          if (user) {
            // When payment fails, fetch the actual subscription status from Stripe
            // Stripe typically sets subscription to "past_due" or "unpaid" when payment fails
            let actualSubscriptionStatus = "past_due"; // Default to past_due for payment failures
            
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              actualSubscriptionStatus = subscription.status;
            } catch (error) {
              // If we can't fetch subscription, use "past_due" as default
              logError("app/api/webhooks/stripe (invoice.payment_failed - fetch subscription)", error);
            }

            // Update status based on actual Stripe subscription status
            // Payment failed means user hasn't paid → UNSUBSCRIBED
            const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscription_status: actualSubscriptionStatus,
                subscriptionStatus: mapStripeStatusToSubscriptionStatus(actualSubscriptionStatus),
                pending_subscription_plan: null, // Clear pending plan since payment failed
                // Note: subscription_plan stays as current plan, but status indicates payment failed
                // This means user loses access until payment is resolved
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
            where: { stripe_subscription_id: subscriptionId },
            select: { 
              id: true, 
              subscription_status: true,
              pending_subscription_plan: true,
            },
          });

          if (user) {
            // Payment succeeded → user has paid → SUBSCRIBED
            // Fetch actual subscription status to ensure accuracy
            let actualSubscriptionStatus = "active"; // Default for successful payment
            let renewalAt: Date | null = null;
            
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              actualSubscriptionStatus = subscription.status;
              if (subscription.current_period_end) {
                renewalAt = new Date(subscription.current_period_end * 1000);
              }
            } catch (error) {
              // If we can't fetch subscription, use "active" as default for payment success
              logError("app/api/webhooks/stripe (invoice.payment_succeeded - fetch subscription)", error);
            }

            // Payment succeeded means user has paid → SUBSCRIBED
            const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
            const updateData: {
              subscription_status: string;
              subscriptionStatus: SubscriptionStatus;
              subscription_plan?: string;
              pending_subscription_plan?: null;
              subscription_renewal_at?: Date;
            } = {
              subscription_status: actualSubscriptionStatus,
              subscriptionStatus: mapStripeStatusToSubscriptionStatus(actualSubscriptionStatus),
            };

            // Update renewal date
            if (renewalAt) {
              updateData.subscription_renewal_at = renewalAt;
            }

            // Apply pending plan change if it exists
            if (user.pending_subscription_plan) {
              updateData.subscription_plan = user.pending_subscription_plan;
              updateData.pending_subscription_plan = null; // Clear pending plan
            }

            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
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
          where: { stripe_customer_id: subscription.customer as string },
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

          // Note: We do NOT update the subscription_add_ons field from subscription items
          // because add-ons should never be in subscriptions.
          // The subscription_add_ons field is only updated via the /api/billing/purchase-addon endpoint.
          // Only update subscription_plan if there's no pending plan change
          // (pending plans are applied on payment success via invoice.payment_succeeded)
          const userWithPending = await prisma.user.findUnique({
            where: { id: user.id },
            select: { pending_subscription_plan: true },
          });

          const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
          const updateData: {
            stripe_subscription_id: string;
            subscription_status: string;
            subscriptionStatus: SubscriptionStatus;
            trial_ends_at: Date | null;
            subscription_started_at: Date;
            subscription_ends_at: Date | null;
            subscription_plan?: string;
          } = {
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            subscriptionStatus: mapStripeStatusToSubscriptionStatus(status),
            trial_ends_at: trialEnd,
            subscription_started_at: new Date(subscription.created * 1000),
            subscription_ends_at:
              subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : subscription.trial_end
                  ? new Date(subscription.trial_end * 1000)
                  : null,
          };

          // Only update subscription_plan if there's no pending plan change
          // Pending plans are applied on payment success, not on subscription update
          if (!userWithPending?.pending_subscription_plan && planName) {
            updateData.subscription_plan = planName;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: subscription.customer as string },
          select: { id: true },
        });

        if (user) {
          // When subscription is deleted (period ended after cancellation, or immediate cancellation)
          // User has not paid / subscription ended → UNSUBSCRIBED
          const { mapStripeStatusToSubscriptionStatus } = await import("@/lib/subscription-helpers");
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscription_status: "canceled",
              subscriptionStatus: mapStripeStatusToSubscriptionStatus("canceled"), // Will be UNSUBSCRIBED
              subscription_ends_at: new Date(),
              pending_subscription_plan: null, // Clear pending plan since subscription is deleted
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
    await prisma.webhook_event_logs.update({
      where: { stripe_event_id: event.id },
      data: {
        processed: true,
        processed_at: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    // Log error but don't mark as processed so it can be retried
    logError("app/api/webhooks/stripe (event processing)", error, {
      eventId: event.id,
      eventType: event.type,
    });

    await prisma.webhook_event_logs.update({
      where: { stripe_event_id: event.id },
      data: {
        error_message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: "Event processing failed" },
      { status: 500 }
    );
  }
}
