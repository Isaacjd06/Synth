"use server";

import { prisma } from "@/lib/prisma";

/**
 * Checks if a Stripe event has already been processed.
 * If the event doesn't exist, creates a new record with processed=false.
 *
 * @param eventId - The Stripe event ID
 * @param type - The Stripe event type
 * @param data - The Stripe event data object
 * @returns true if the event should be processed (new event), false if already exists
 */
export async function checkAndStoreStripeEvent(
  eventId: string,
  type: string,
  data: unknown,
): Promise<boolean> {
  // Check if event already exists
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { stripe_event_id: eventId },
  });

  // If event exists, it's already been seen (either processed or in progress)
  if (existingEvent) {
    return false;
  }

  // Event doesn't exist, create it with processed=false
  try {
    await prisma.stripeEvent.create({
      data: {
        stripe_event_id: eventId,
        type,
        data,
        processed: false,
      },
    });
    return true;
  } catch (error: unknown) {
    // If creation fails due to unique constraint (race condition),
    // another request already created it, so return false
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return false;
    }
    throw error;
  }
}

/**
 * Marks a Stripe event as processed.
 *
 * @param eventId - The Stripe event ID
 */
export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await prisma.stripeEvent.update({
    where: { stripe_event_id: eventId },
    data: { processed: true },
  });
}
