import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * GET /api/billing/state
 * 
 * Fetches the current billing state for the authenticated user.
 * Returns plan, subscription status, add-ons, and payment method information.
 */
export async function GET(req: Request) {
  try {
    // 1. Verify authentication
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_ID_NOT_FOUND",
          message: "User ID not found",
        },
        { status: 400 }
      );
    }

    // 2. Fetch user from Prisma with billing fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
        subscription_plan: true,
        pending_subscription_plan: true,
        subscription_status: true, // Legacy field for backward compatibility
        subscriptionStatus: true, // New enum field - primary source of truth
        subscription_renewal_at: true,
        trial_ends_at: true,
        subscription_add_ons: true,
        last_plan_change_at: true,
        has_active_payment_method: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // 3. Check if user has a payment method (if they have a Stripe customer)
    let hasPaymentMethod = false;
    let billingPeriod: "monthly" | "yearly" | null = null;

    // Only attempt Stripe operations if Stripe is configured
    if (user.stripe_customer_id && stripe) {
      try {
        // Fetch Stripe customer to check for default payment method
        const customer = await stripe.customers.retrieve(user.stripe_customer_id, {
          expand: ["invoice_settings.default_payment_method"],
        });

        if (!customer.deleted) {
          // Check if customer has a default payment method
          hasPaymentMethod = !!(
            customer.invoice_settings?.default_payment_method &&
            (typeof customer.invoice_settings.default_payment_method === "string" ||
              (customer.invoice_settings.default_payment_method as Stripe.PaymentMethod)?.id)
          );
        }

        // Determine billing period from subscription if it exists
        if (user.stripe_subscription_id) {
          try {
            const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
              expand: ["items.data.price"],
            });

            // Get the plan price ID from the first subscription item
            const planPriceId = subscription.items.data[0]?.price.id;
            if (planPriceId) {
              const { isYearlyPriceId } = await import("@/lib/billing");
              const isYearly = isYearlyPriceId(planPriceId);
              if (isYearly !== null) {
                billingPeriod = isYearly ? "yearly" : "monthly";
              }
            }
          } catch (error: unknown) {
            // Log error but don't fail - billing period detection is best effort
            logError("app/api/billing/state (billing period detection)", error, {
              userId,
              subscriptionId: user.stripe_subscription_id,
            });
          }
        }
      } catch (error: unknown) {
        // Log error but don't fail the request - payment method check is best effort
        logError("app/api/billing/state (payment method check)", error, {
          userId,
          customerId: user.stripe_customer_id,
        });
        // Continue with hasPaymentMethod = false
      }
    } else if (user.stripe_customer_id && !stripe) {
      // Stripe is not configured, but user has a customer ID - use database fallback
      hasPaymentMethod = user.has_active_payment_method || false;
    }

    // 4. Calculate plan change eligibility (14-day rule)
    let canChangePlan = true;
    let daysUntilNextChange: number | null = null;
    
    if (user.last_plan_change_at) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - user.last_plan_change_at.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastChange < 14) {
        canChangePlan = false;
        daysUntilNextChange = 14 - daysSinceLastChange;
      }
    }

    // 5. Calculate usage limits
    const { getPlanWorkflowLimit } = await import("@/lib/plan-enforcement");
    const maxWorkflows = getPlanWorkflowLimit(user.subscription_plan);
    
    // Get current usage counts
    const currentWorkflowCount = await prisma.workflows.count({
      where: { user_id: userId },
    });
    
    const currentExecutionCount = await prisma.executions.count({
      where: { user_id: userId },
    });

    // For MVP, execution limits are not enforced per plan, but we'll return null for unlimited
    // This can be expanded later if needed
    const maxExecutions: number | null = null; // Unlimited for MVP

    // 6. Build and return response
    // Use the new enum field as primary source, fallback to legacy field for backward compatibility
    const { SubscriptionStatus } = await import("@prisma/client");
    const subscriptionStatusValue: "SUBSCRIBED" | "UNSUBSCRIBED" = user.subscriptionStatus === SubscriptionStatus.SUBSCRIBED 
      ? "SUBSCRIBED"
      : user.subscriptionStatus === SubscriptionStatus.UNSUBSCRIBED
      ? "UNSUBSCRIBED"
      : (user.subscription_status === "active" || user.subscription_status === "trialing" 
        ? "SUBSCRIBED" 
        : "UNSUBSCRIBED");

    const response = {
      plan: user.subscription_plan || null,
      current_plan: user.subscription_plan || null, // Alias for consistency
      next_plan: user.pending_subscription_plan || null,
      subscriptionStatus: subscriptionStatusValue, // New enum field value (SUBSCRIBED/UNSUBSCRIBED)
      subscriptionStatusLegacy: user.subscription_status || null, // Legacy field for reference
      subscriptionRenewalAt: user.subscription_renewal_at
        ? user.subscription_renewal_at.toISOString()
        : null,
      trialEndsAt: user.trial_ends_at
        ? user.trial_ends_at.toISOString()
        : null,
      addOns: user.subscription_add_ons || [],
      stripeCustomerId: user.stripe_customer_id || null,
      hasPaymentMethod: hasPaymentMethod || user.has_active_payment_method || false,
      billingPeriod, // "monthly" | "yearly" | null
      can_change_plan: canChangePlan,
      days_until_next_change: daysUntilNextChange,
      usage_limits: {
        workflows: {
          current: currentWorkflowCount,
          max: maxWorkflows > 0 ? maxWorkflows : null, // null means unlimited
        },
        executions: {
          current: currentExecutionCount,
          max: maxExecutions, // null means unlimited for MVP
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    logError("app/api/billing/state", error, {
      userId: (await auth())?.user?.id,
    });

    // Return a safe fallback response instead of 500 error
    // This prevents app-wide crashes when billing data is unavailable
    // The frontend will handle the degraded state gracefully
    return NextResponse.json(
      {
        plan: null,
        current_plan: null,
        next_plan: null,
        subscriptionStatus: "UNSUBSCRIBED",
        subscriptionStatusLegacy: null,
        subscriptionRenewalAt: null,
        trialEndsAt: null,
        addOns: [],
        stripeCustomerId: null,
        hasPaymentMethod: false,
        billingPeriod: null,
        can_change_plan: false,
        days_until_next_change: null,
        usage_limits: {
          workflows: {
            current: 0,
            max: null,
          },
          executions: {
            current: 0,
            max: null,
          },
        },
      },
      { status: 200 } // Return 200 with safe defaults instead of 500
    );
  }
}

