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
      stripe_customer_id: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // If we have a customer ID, verify it exists in Stripe
  if (user.stripe_customer_id) {
    try {
      // Verify the customer exists in Stripe
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      
      // If customer was deleted, it will have deleted: true
      if (customer.deleted) {
        // Customer was deleted, create a new one
        console.warn(`Customer ${user.stripe_customer_id} was deleted in Stripe, creating new customer`);
      } else {
        // Customer exists and is valid
        return user.stripe_customer_id;
      }
    } catch (error: unknown) {
      // Customer doesn't exist (404) or other error
      const stripeError = error as { code?: string; type?: string };
      if (stripeError.code === "resource_missing" || stripeError.type === "StripeInvalidRequestError") {
        // Customer doesn't exist in Stripe, create a new one
        console.warn(`Customer ${user.stripe_customer_id} not found in Stripe, creating new customer`);
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  }

  // Create new Stripe customer (either doesn't exist or was deleted)
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
    data: { stripe_customer_id: customer.id },
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

/**
 * Create a subscription with a plan only.
 *
 * ⚠️ IMPORTANT: Add-ons are NOT supported in subscriptions.
 * Add-ons are one-time purchases only and must be purchased separately.
 *
 * @param planPriceId - Stripe price ID for the plan
 * @param customerId - Stripe customer ID
 * @param trialDays - Optional trial period in days
 * @returns Stripe subscription object
 */
export async function createSubscription(
  planPriceId: string,
  customerId: string,
  trialDays?: number,
): Promise<Stripe.Subscription> {
  // Build subscription with plan only
  const items: Stripe.SubscriptionCreateParams.Item[] = [
    { price: planPriceId, quantity: 1 },
  ];

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
 *
 * ⚠️ IMPORTANT: This only switches the plan. Add-ons are NOT part of subscriptions.
 * Any additional subscription items found will be removed as they shouldn't exist.
 *
 * @param subscriptionId - Stripe subscription ID
 * @param newPlanPriceId - Stripe price ID for the new plan
 * @returns Updated Stripe subscription object
 */
export async function switchSubscriptionPlan(
  subscriptionId: string,
  newPlanPriceId: string,
): Promise<Stripe.Subscription> {
  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // First item should be the plan
  const planItem = subscription.items.data[0];

  if (!planItem) {
    throw new Error("Plan item not found in subscription");
  }

  // Check for any additional items that shouldn't be there
  const additionalItems = subscription.items.data.slice(1);
  if (additionalItems.length > 0) {
    console.warn(
      `Found ${additionalItems.length} unexpected subscription items that will be removed. ` +
      `Add-ons should not be in subscriptions - they are one-time purchases only.`
    );
  }

  // Build items array: only the plan (remove any additional items)
  const items: Stripe.SubscriptionUpdateParams.Item[] = [
    { id: planItem.id, price: newPlanPriceId }, // Update plan
    // Remove any additional items by marking them as deleted
    ...additionalItems.map(item => ({ id: item.id, deleted: true })),
  ];

  // Update the subscription with new plan only
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items,
    proration_behavior: "none",
  });

  return updatedSubscription;
}

/**
 * ⚠️ DEPRECATED: This function should not be used.
 *
 * Add-ons are ONE-TIME purchases only and should NOT be added to subscriptions.
 * Use the one-time purchase API endpoint instead: /api/billing/purchase-addon
 *
 * This function is kept for backward compatibility but will throw an error if called.
 *
 * @deprecated Use one-time purchase endpoint for add-ons
 * @throws Error indicating add-ons cannot be added to subscriptions
 */
export async function updateSubscriptionAddons(
  subscriptionId: string,
  desiredAddOns: unknown[],
): Promise<Stripe.Subscription> {
  throw new Error(
    "Add-ons cannot be added to subscriptions. " +
    "Add-ons are one-time purchases only. " +
    "Use /api/billing/purchase-addon endpoint instead."
  );
}

/**
 * Calculate the total cost for a plan + add-ons
 */
export async function calculateSubscriptionTotal(
  planPriceId: string,
  addOnPriceIds: string[] = [],
): Promise<{
  total: number;
  currency: string;
  breakdown: {
    plan: { price_id: string; amount: number };
    addOns: Array<{ price_id: string; amount: number; currency: string }>;
  };
}> {
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
  // Get all valid plan price IDs from env (both monthly and yearly)
  const validPlanPriceIds = [
    process.env.STRIPE_STARTER_PRICE_ID,
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_AGENCY_PRICE_ID,
    process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
  ].filter(Boolean);

  // Check if plan is valid
  if (!validPlanPriceIds.includes(planPriceId)) {
    return { valid: false, error: "Invalid plan price ID" };
  }

  // Get all valid add-on price IDs from env
  const validAddOnPriceIds = [
    process.env.STRIPE_ADDON_RAPID_AUTOMATION_BOOSTER_PRICE_ID,
    process.env.STRIPE_ADDON_WORKFLOW_PERFORMANCE_TURBO_PRICE_ID,
    process.env.STRIPE_ADDON_BUSINESS_SYSTEMS_JUMPSTART_PRICE_ID,
    process.env.STRIPE_ADDON_AI_PERSONA_TRAINING_PRICE_ID,
    process.env.STRIPE_ADDON_UNLIMITED_KNOWLEDGE_INJECTION_PRICE_ID,
    // Legacy addon price IDs (for backward compatibility)
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
 * Map Stripe price ID to plan name
 * This is the reverse mapping of plan names to price IDs
 *
 * Backend plan names:
 * - "starter" → Starter plan (3 workflows)
 * - "pro" → Growth plan (10 workflows)
 * - "agency" → Scale plan (40 workflows)
 *
 * @param priceId - Stripe price ID to map
 * @returns Plan name ("starter" | "pro" | "agency") or null if not found
 */
export function getPlanNameFromPriceId(priceId: string): string | null {
  if (!priceId) {
    console.warn("getPlanNameFromPriceId: Empty price ID provided");
    return null;
  }

  // Get all valid plan price IDs from env
  // Note: Yearly price IDs may not be configured - they're optional
  const planMappings: Array<{ name: string; priceId: string | undefined }> = [
    // Monthly plans
    { name: "starter", priceId: process.env.STRIPE_STARTER_PRICE_ID },
    { name: "pro", priceId: process.env.STRIPE_PRO_PRICE_ID },
    { name: "agency", priceId: process.env.STRIPE_AGENCY_PRICE_ID },
    // Yearly plans (optional)
    { name: "starter", priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID },
    { name: "pro", priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID },
    { name: "agency", priceId: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID },
  ];

  // Find the plan name that matches this price ID
  const mapping = planMappings.find((m) => m.priceId && m.priceId === priceId);

  if (!mapping) {
    console.warn(`getPlanNameFromPriceId: Unknown price ID "${priceId}". ` +
      `This could mean: 1) Price ID not in .env, 2) Yearly billing not configured, ` +
      `3) Invalid/test price ID used. Check your Stripe configuration.`);
    return null;
  }

  return mapping.name;
}

/**
 * Determine if a Stripe price ID is for yearly billing
 *
 * @param priceId - Stripe price ID to check
 * @returns true if yearly, false if monthly, null if unknown
 */
export function isYearlyPriceId(priceId: string): boolean | null {
  if (!priceId) {
    return null;
  }

  const yearlyPriceIds = [
    process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
  ].filter(Boolean);

  return yearlyPriceIds.includes(priceId);
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
 * Validate that addons can only be purchased with first subscription payment
 * 
 * @param userId - User ID to check
 * @param addons - Array of addon IDs to validate
 * @returns Object with valid flag and error message if invalid
 */
export async function validateAddonPurchaseWithSubscription(
  userId: string,
  addons: string[],
): Promise<{ valid: boolean; error?: string }> {
  if (addons.length === 0) {
    return { valid: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripe_subscription_id: true,
      subscription_status: true,
      subscription_add_ons: true,
    },
  });

  if (!user) {
    return { valid: false, error: "User not found" };
  }

  // If user has any subscription (any status), addons cannot be purchased
  // Addons can only be purchased with the first subscription payment
  if (user.stripe_subscription_id) {
    return {
      valid: false,
      error: "Add-ons can only be purchased with the first subscription payment. You already have a subscription.",
    };
  }

  // Check if any addon is already owned
  const alreadyOwned = addons.filter(addon => user.subscription_add_ons.includes(addon));
  if (alreadyOwned.length > 0) {
    return {
      valid: false,
      error: `You already own the following add-on(s): ${alreadyOwned.join(", ")}`,
    };
  }

  return { valid: true };
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
    // Use type assertion with unknown intermediate to safely access Stripe's method
    const invoices = stripe.invoices as unknown as {
      retrieveUpcoming: (params: { customer: string }) => Promise<Stripe.Invoice>;
    };
    return await invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    // No upcoming invoice
    if (err.code === "invoice_upcoming_none") {
      return null;
    }
    throw error;
  }
}
