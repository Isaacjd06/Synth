import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Return existing customer ID if it exists
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  });

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Attach a payment method to a customer and set it as default
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string,
): Promise<void> {
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

interface AddOn {
  price_id: string;
  name: string;
  quantity: number;
}

/**
 * Create a subscription with plan and add-ons
 */
export async function createSubscriptionWithAddons(
  customerId: string,
  planPriceId: string,
  addOns: AddOn[] = [],
  trialDays?: number,
): Promise<Stripe.Subscription> {
  // Build line items: plan + add-ons
  const items: Stripe.SubscriptionCreateParams.Item[] = [
    { price: planPriceId, quantity: 1 },
  ];

  // Add add-ons
  for (const addOn of addOns) {
    items.push({
      price: addOn.price_id,
      quantity: addOn.quantity,
    });
  }

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items,
    // Use default behavior: auto-charge the default payment method
    // Remove payment_behavior to use Stripe's default (error_if_incomplete)
    expand: ["latest_invoice.payment_intent"],
  };

  // Add trial if specified
  if (trialDays && trialDays > 0) {
    subscriptionParams.trial_period_days = trialDays;
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams);

  return subscription;
}

/**
 * Switch subscription to a new plan (upgrade/downgrade)
 */
export async function switchSubscriptionPlan(
  subscriptionId: string,
  newPlanPriceId: string,
): Promise<Stripe.Subscription> {
  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Preserve add-ons while switching plan
  // First item is the plan, rest are add-ons
  const planItem = subscription.items.data[0];

  if (!planItem) {
    throw new Error("Plan item not found in subscription");
  }

  const addOnItems = subscription.items.data.slice(1);

  // Build items array: update plan, preserve add-ons
  const items: Stripe.SubscriptionUpdateParams.Item[] = [
    { id: planItem.id, price: newPlanPriceId }, // Update plan
    ...addOnItems.map(item => ({ id: item.id })), // Keep add-ons
  ];

  // Update the subscription with new plan and preserved add-ons
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items,
    proration_behavior: "none",
  });

  return updatedSubscription;
}

/**
 * Add or update add-ons for a subscription
 */
export async function updateSubscriptionAddons(
  subscriptionId: string,
  desiredAddOns: AddOn[],
): Promise<Stripe.Subscription> {
  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find plan item (first item) and current add-on items
  const planItem = subscription.items.data[0];
  const currentAddOnItems = subscription.items.data.slice(1);

  // Build the update parameters
  const items: Stripe.SubscriptionUpdateParams.Item[] = [
    // Keep the plan item unchanged
    { id: planItem.id },
  ];

  // Create a map of current add-ons by price_id
  const currentAddOnsMap = new Map(
    currentAddOnItems.map((item) => [item.price.id, item]),
  );

  // Create a map of desired add-ons by price_id
  const desiredAddOnsMap = new Map(
    desiredAddOns.map((addon) => [addon.price_id, addon]),
  );

  // Remove add-ons that are no longer desired
  for (const [priceId, item] of currentAddOnsMap) {
    if (!desiredAddOnsMap.has(priceId)) {
      items.push({ id: item.id, deleted: true });
    }
  }

  // Add new add-ons or update existing ones
  for (const [priceId, addOn] of desiredAddOnsMap) {
    const existingItem = currentAddOnsMap.get(priceId);
    if (existingItem) {
      // Update quantity if it changed
      if (existingItem.quantity !== addOn.quantity) {
        items.push({ id: existingItem.id, quantity: addOn.quantity });
      } else {
        // Keep unchanged
        items.push({ id: existingItem.id });
      }
    } else {
      // Add new add-on
      items.push({ price: priceId, quantity: addOn.quantity });
    }
  }

  // Update subscription
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items,
    proration_behavior: "none",
  });

  return updatedSubscription;
}

/**
 * Calculate the total cost for a plan + add-ons
 */
export async function calculateSubscriptionTotal(
  planPriceId: string,
  addOnPriceIds: string[] = [],
): Promise<{ total: number; currency: string; breakdown: any }> {
  // Fetch plan price
  const planPrice = await stripe.prices.retrieve(planPriceId);
  const planAmount = planPrice.unit_amount || 0;
  const currency = planPrice.currency;

  let addOnsTotal = 0;
  const addOnBreakdown = [];

  // Fetch add-on prices
  for (const addOnPriceId of addOnPriceIds) {
    const addOnPrice = await stripe.prices.retrieve(addOnPriceId);
    const amount = addOnPrice.unit_amount || 0;
    addOnsTotal += amount;
    addOnBreakdown.push({
      price_id: addOnPriceId,
      amount,
      currency: addOnPrice.currency,
    });
  }

  return {
    total: planAmount + addOnsTotal,
    currency,
    breakdown: {
      plan: { price_id: planPriceId, amount: planAmount },
      addOns: addOnBreakdown,
    },
  };
}

/**
 * Validate plan and add-on price IDs against environment variables
 */
export function validatePlanAndAddons(
  planPriceId: string,
  addOnPriceIds: string[] = [],
): { valid: boolean; error?: string } {
  // Get all valid plan price IDs from env
  const validPlanPriceIds = [
    process.env.STRIPE_STARTER_PRICE_ID,
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_AGENCY_PRICE_ID,
  ].filter(Boolean);

  // Check if plan is valid
  if (!validPlanPriceIds.includes(planPriceId)) {
    return { valid: false, error: "Invalid plan price ID" };
  }

  // Get all valid add-on price IDs from env
  const validAddOnPriceIds = [
    process.env.STRIPE_ADDON_EXTRA_WORKFLOWS_PRICE_ID,
    process.env.STRIPE_ADDON_PRIORITY_SUPPORT_PRICE_ID,
    process.env.STRIPE_ADDON_WHITE_LABEL_PRICE_ID,
  ].filter(Boolean);

  // Check if all add-ons are valid
  for (const addOnPriceId of addOnPriceIds) {
    if (!validAddOnPriceIds.includes(addOnPriceId)) {
      return { valid: false, error: `Invalid add-on price ID: ${addOnPriceId}` };
    }
  }

  return { valid: true };
}

/**
 * Get payment method details for a customer
 */
export async function getPaymentMethod(
  paymentMethodId: string,
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true,
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    // Cancel at end of billing period
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    // Cancel immediately
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Get upcoming invoice for a customer
 */
export async function getUpcomingInvoice(
  customerId: string,
): Promise<Stripe.Invoice | null> {
  try {
    return await (stripe.invoices as any).retrieveUpcoming({
      customer: customerId,
    });
  } catch (error: any) {
    // No upcoming invoice
    if (error.code === "invoice_upcoming_none") {
      return null;
    }
    throw error;
  }
}
