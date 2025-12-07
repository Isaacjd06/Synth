import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { calculateSubscriptionTotal, validatePlanAndAddons, getPlanNameFromPriceId } from "@/lib/billing";
import { logError } from "@/lib/error-logger";
import Stripe from "stripe";

/**
 * Map plan identifiers to Stripe price IDs (monthly)
 */
const PLAN_PRICE_MAP_MONTHLY: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || "",
  pro: process.env.STRIPE_PRO_PRICE_ID || "",
  agency: process.env.STRIPE_AGENCY_PRICE_ID || "",
};

/**
 * Map plan identifiers to Stripe price IDs (yearly)
 */
const PLAN_PRICE_MAP_YEARLY: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "",
  pro: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  agency: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID || "",
};

/**
 * Map add-on identifiers to Stripe price IDs and human-readable names
 */
const ADDON_MAP: Record<
  string,
  { priceId: string; name: string }
> = {
  rapid_booster: {
    priceId: process.env.STRIPE_ADDON_RAPID_AUTOMATION_BOOSTER_PRICE_ID || "",
    name: "Rapid Automation Booster",
  },
  performance_turbo: {
    priceId: process.env.STRIPE_ADDON_WORKFLOW_PERFORMANCE_TURBO_PRICE_ID || "",
    name: "Workflow Performance Turbo",
  },
  business_jumpstart: {
    priceId: process.env.STRIPE_ADDON_BUSINESS_SYSTEMS_JUMPSTART_PRICE_ID || "",
    name: "Business Systems Jumpstart",
  },
  persona_training: {
    priceId: process.env.STRIPE_ADDON_AI_PERSONA_TRAINING_PRICE_ID || "",
    name: "AI Persona Training",
  },
  unlimited_knowledge: {
    priceId: process.env.STRIPE_ADDON_UNLIMITED_KNOWLEDGE_INJECTION_PRICE_ID || "",
    name: "Unlimited Knowledge Injection",
  },
};

interface CheckoutDetailsRequest {
  plan: string;
  addons?: string[];
  billingPeriod?: "monthly" | "yearly";
  customerLocation?: {
    country?: string;
    postal_code?: string;
    state?: string;
  };
}

/**
 * GET /api/checkout/details
 * 
 * Returns checkout details including selected plan, addons, and total price.
 * This endpoint validates the selection and calculates the total cost.
 * 
 * Query parameters:
 * - plan: Plan identifier (starter, pro, agency)
 * - addons: Comma-separated list of addon identifiers (optional)
 * 
 * Response:
 * {
 *   plan: { id, name, price_id, amount, currency },
 *   addons: [{ id, name, price_id, amount, currency }],
 *   total: number (in cents),
 *   currency: string,
 *   breakdown: { plan, addons }
 * }
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
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

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan");
    const addonsParam = searchParams.get("addons");
    const billingPeriod = (searchParams.get("billingPeriod") as "monthly" | "yearly") || "monthly";
    const customerCountry = searchParams.get("country");
    const customerPostalCode = searchParams.get("postal_code");
    const customerState = searchParams.get("state");

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PLAN",
          message: "plan parameter is required",
        },
        { status: 400 }
      );
    }

    // Parse addons (comma-separated or JSON array)
    let addons: string[] = [];
    if (addonsParam) {
      try {
        // Try parsing as JSON array first
        addons = JSON.parse(addonsParam);
      } catch {
        // If not JSON, treat as comma-separated string
        addons = addonsParam.split(",").map(a => a.trim()).filter(Boolean);
      }
    }

    // 3. Validate plan and get price ID based on billing period
    const priceMap = billingPeriod === "yearly" ? PLAN_PRICE_MAP_YEARLY : PLAN_PRICE_MAP_MONTHLY;
    const planPriceId = priceMap[plan];
    if (!planPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${plan}. Must be one of: starter, pro, agency`,
        },
        { status: 400 }
      );
    }

    // 4. Validate addons
    const addonPriceIds: string[] = [];
    const addonDetails: Array<{
      id: string;
      name: string;
      price_id: string;
      amount: number;
      currency: string;
    }> = [];

    for (const addonId of addons) {
      const addonInfo = ADDON_MAP[addonId];
      if (!addonInfo || !addonInfo.priceId) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_ADDON",
            message: `Invalid add-on: ${addonId}`,
          },
          { status: 400 }
        );
      }
      addonPriceIds.push(addonInfo.priceId);
    }

    // 5. Validate plan and addons using billing helper
    const validation = validatePlanAndAddons(planPriceId, addonPriceIds);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_FAILED",
          message: validation.error || "Validation failed",
        },
        { status: 400 }
      );
    }

    // 6. Calculate total
    const totalInfo = await calculateSubscriptionTotal(planPriceId, addonPriceIds);

    // 7. Get plan details
    const planPrice = await stripe.prices.retrieve(planPriceId);
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

    // 8. Get addon details
    for (const addonId of addons) {
      const addonInfo = ADDON_MAP[addonId];
      const addonPrice = await stripe.prices.retrieve(addonInfo.priceId);
      addonDetails.push({
        id: addonId,
        name: addonInfo.name,
        price_id: addonInfo.priceId,
        amount: addonPrice.unit_amount || 0,
        currency: addonPrice.currency || "usd",
      });
    }

    // 9. Calculate tax using Stripe Tax Calculation API if customer location is provided
    let taxAmount = 0;
    let taxDetails: Stripe.Tax.Calculation | null = null;
    
    if (customerCountry && customerPostalCode) {
      try {
        // Build line items for tax calculation
        const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = [
          {
            amount: planPrice.unit_amount || 0,
            reference: `plan_${plan}`,
          },
        ];

        // Add addon line items
        for (const addonDetail of addonDetails) {
          lineItems.push({
            amount: addonDetail.amount,
            reference: `addon_${addonDetail.id}`,
          });
        }

        // Create tax calculation
        const taxCalculation = await stripe.tax.calculations.create({
          currency: totalInfo.currency,
          line_items: lineItems,
          customer_details: {
            address: {
              country: customerCountry,
              postal_code: customerPostalCode,
              state: customerState || undefined,
            },
            address_source: "billing",
          },
        });

        taxAmount = taxCalculation.tax_amount_exclusive;
        taxDetails = taxCalculation;
      } catch (taxError: unknown) {
        // Log error but don't fail the request - tax calculation is optional
        logError("app/api/checkout/details (tax calculation)", taxError, {
          userId: session.user.id,
          country: customerCountry,
          postal_code: customerPostalCode,
        });
        // Continue without tax - taxAmount remains 0
      }
    }

    // 10. Return checkout details with tax
    return NextResponse.json(
      {
        success: true,
        plan: {
          id: plan,
          name: planName,
          price_id: planPriceId,
          amount: planPrice.unit_amount || 0,
          currency: planPrice.currency || "usd",
        },
        addons: addonDetails,
        subtotal: totalInfo.total,
        tax: taxAmount,
        total: totalInfo.total + taxAmount,
        currency: totalInfo.currency,
        breakdown: totalInfo.breakdown,
        tax_breakdown: taxDetails?.tax_breakdown || null,
        billing_period: billingPeriod,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/checkout/details", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/checkout/details
 * 
 * Same as GET but accepts plan and addons in request body.
 * This is useful when the frontend wants to send data in POST body.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
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

    // 2. Parse request body
    const body = await req.json() as CheckoutDetailsRequest;
    const { plan, addons = [], billingPeriod = "monthly", customerLocation } = body;

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_PLAN",
          message: "plan is required",
        },
        { status: 400 }
      );
    }

    // 3. Validate plan and get price ID based on billing period
    const priceMap = billingPeriod === "yearly" ? PLAN_PRICE_MAP_YEARLY : PLAN_PRICE_MAP_MONTHLY;
    const planPriceId = priceMap[plan];
    if (!planPriceId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PLAN",
          message: `Invalid plan: ${plan}. Must be one of: starter, pro, agency`,
        },
        { status: 400 }
      );
    }

    // 4. Validate addons
    const addonPriceIds: string[] = [];
    const addonDetails: Array<{
      id: string;
      name: string;
      price_id: string;
      amount: number;
      currency: string;
    }> = [];

    for (const addonId of addons) {
      const addonInfo = ADDON_MAP[addonId];
      if (!addonInfo || !addonInfo.priceId) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_ADDON",
            message: `Invalid add-on: ${addonId}`,
          },
          { status: 400 }
        );
      }
      addonPriceIds.push(addonInfo.priceId);
    }

    // 5. Validate plan and addons using billing helper
    const validation = validatePlanAndAddons(planPriceId, addonPriceIds);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_FAILED",
          message: validation.error || "Validation failed",
        },
        { status: 400 }
      );
    }

    // 6. Calculate total
    const totalInfo = await calculateSubscriptionTotal(planPriceId, addonPriceIds);

    // 7. Get plan details
    const planPrice = await stripe.prices.retrieve(planPriceId);
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

    // 8. Get addon details
    for (const addonId of addons) {
      const addonInfo = ADDON_MAP[addonId];
      const addonPrice = await stripe.prices.retrieve(addonInfo.priceId);
      addonDetails.push({
        id: addonId,
        name: addonInfo.name,
        price_id: addonInfo.priceId,
        amount: addonPrice.unit_amount || 0,
        currency: addonPrice.currency || "usd",
      });
    }

    // 9. Calculate tax using Stripe Tax Calculation API if customer location is provided
    let taxAmount = 0;
    let taxDetails: Stripe.Tax.Calculation | null = null;
    
    if (customerLocation?.country && customerLocation?.postal_code) {
      try {
        // Build line items for tax calculation
        const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = [
          {
            amount: planPrice.unit_amount || 0,
            reference: `plan_${plan}`,
          },
        ];

        // Add addon line items
        for (const addonDetail of addonDetails) {
          lineItems.push({
            amount: addonDetail.amount,
            reference: `addon_${addonDetail.id}`,
          });
        }

        // Create tax calculation
        const taxCalculation = await stripe.tax.calculations.create({
          currency: totalInfo.currency,
          line_items: lineItems,
          customer_details: {
            address: {
              country: customerLocation.country,
              postal_code: customerLocation.postal_code,
              state: customerLocation.state || undefined,
            },
            address_source: "billing",
          },
        });

        taxAmount = taxCalculation.tax_amount_exclusive;
        taxDetails = taxCalculation;
      } catch (taxError: unknown) {
        // Log error but don't fail the request - tax calculation is optional
        logError("app/api/checkout/details (tax calculation)", taxError, {
          userId: session.user.id,
          country: customerLocation.country,
          postal_code: customerLocation.postal_code,
        });
        // Continue without tax - taxAmount remains 0
      }
    }

    // 10. Return checkout details with tax
    return NextResponse.json(
      {
        success: true,
        plan: {
          id: plan,
          name: planName,
          price_id: planPriceId,
          amount: planPrice.unit_amount || 0,
          currency: planPrice.currency || "usd",
        },
        addons: addonDetails,
        subtotal: totalInfo.total,
        tax: taxAmount,
        total: totalInfo.total + taxAmount,
        currency: totalInfo.currency,
        breakdown: totalInfo.breakdown,
        tax_breakdown: taxDetails?.tax_breakdown || null,
        billing_period: billingPeriod,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/checkout/details", error, {
      userId: (await auth())?.user?.id,
    });

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

