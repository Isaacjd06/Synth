/**
 * Subscription Status Helpers
 * 
 * Utilities for mapping between Stripe subscription statuses and our internal enum
 */

import { SubscriptionStatus } from "@prisma/client";

/**
 * Map Stripe subscription status to our SubscriptionStatus enum
 * 
 * SUBSCRIBED: User has paid and subscription is active
 * UNSUBSCRIBED: User has not paid, payment failed, subscription canceled, or past due
 * 
 * @param stripeStatus - Stripe subscription status (active, trialing, past_due, canceled, etc.)
 * @returns SubscriptionStatus enum value
 */
export function mapStripeStatusToSubscriptionStatus(
  stripeStatus: string | null | undefined
): SubscriptionStatus {
  if (!stripeStatus) {
    return SubscriptionStatus.UNSUBSCRIBED;
  }

  const normalized = stripeStatus.toLowerCase();

  // SUBSCRIBED states: User has paid and subscription is active
  // - "active": Subscription is active and payment succeeded
  // - "trialing": User is in trial period (considered subscribed for access)
  if (normalized === "active" || normalized === "trialing") {
    return SubscriptionStatus.SUBSCRIBED;
  }

  // UNSUBSCRIBED states: User has not paid or payment failed
  // - "past_due": Payment failed, user hasn't paid
  // - "canceled": Subscription was canceled
  // - "unpaid": Subscription is unpaid
  // - "incomplete": Initial payment failed
  // - "incomplete_expired": Initial payment expired
  // - "inactive": Subscription is inactive
  // - "cancels_at_period_end": Will cancel at period end (still has access until then)
  // Note: "cancels_at_period_end" should still be SUBSCRIBED until period actually ends
  
  // Special case: "cancels_at_period_end" means subscription will cancel but user still has access
  // We should treat this as SUBSCRIBED until the subscription actually ends
  if (normalized === "cancels_at_period_end") {
    return SubscriptionStatus.SUBSCRIBED;
  }

  // All other states mean user has not paid → UNSUBSCRIBED
  return SubscriptionStatus.UNSUBSCRIBED;
}

/**
 * Map our SubscriptionStatus enum to a Stripe-like status string (for compatibility)
 * 
 * @param status - Our SubscriptionStatus enum
 * @returns Stripe-compatible status string
 */
export function mapSubscriptionStatusToStripeStatus(
  status: SubscriptionStatus
): string {
  switch (status) {
    case SubscriptionStatus.SUBSCRIBED:
      return "active";
    case SubscriptionStatus.UNSUBSCRIBED:
      return "inactive";
    default:
      return "inactive";
  }
}

