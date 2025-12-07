import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { logError } from "@/lib/error-logger";

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
 * GET /api/billing/prices
 * 
 * Returns actual Stripe prices for all plans (monthly and yearly).
 * This ensures the UI displays the exact prices from Stripe, not hardcoded values.
 * 
 * Response:
 * {
 *   monthly: {
 *     starter: { amount: 2900, currency: "usd", price_id: "price_xxx" },
 *     pro: { amount: 9900, currency: "usd", price_id: "price_xxx" },
 *     agency: { amount: 29900, currency: "usd", price_id: "price_xxx" }
 *   },
 *   yearly: {
 *     starter: { amount: 29000, currency: "usd", price_id: "price_xxx" },
 *     pro: { amount: 99000, currency: "usd", price_id: "price_xxx" },
 *     agency: { amount: 299000, currency: "usd", price_id: "price_xxx" }
 *   }
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

    // 2. Fetch all plan prices from Stripe
    const monthlyPrices: Record<string, { amount: number; currency: string; price_id: string }> = {};
    const yearlyPrices: Record<string, { amount: number; currency: string; price_id: string }> = {};

    // Fetch monthly prices
    for (const [planId, priceId] of Object.entries(PLAN_PRICE_MAP_MONTHLY)) {
      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId);
          monthlyPrices[planId] = {
            amount: price.unit_amount || 0,
            currency: price.currency || "usd",
            price_id: priceId,
          };
        } catch (error: unknown) {
          logError("app/api/billing/prices (monthly price fetch)", error, {
            planId,
            priceId,
          });
          // Continue with other plans even if one fails
        }
      }
    }

    // Fetch yearly prices
    for (const [planId, priceId] of Object.entries(PLAN_PRICE_MAP_YEARLY)) {
      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId);
          yearlyPrices[planId] = {
            amount: price.unit_amount || 0,
            currency: price.currency || "usd",
            price_id: priceId,
          };
        } catch (error: unknown) {
          logError("app/api/billing/prices (yearly price fetch)", error, {
            planId,
            priceId,
          });
          // Continue with other plans even if one fails
        }
      }
    }

    // 3. Return prices
    return NextResponse.json(
      {
        success: true,
        monthly: monthlyPrices,
        yearly: yearlyPrices,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logError("app/api/billing/prices", error, {
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

