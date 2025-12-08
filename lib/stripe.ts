/**
 * Server-side Stripe client helper
 * 
 * ⚠️ SERVER-ONLY: This module must NOT be imported in client components.
 * Use this only in API routes, server actions, and server components.
 * 
 * Provides a singleton Stripe client instance to avoid re-instantiation
 * on every request, improving performance and connection reuse.
 */

import Stripe from "stripe";

// Validate required environment variable (only in production)
// In development, allow missing key to avoid blocking auth setup
if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error(
    "STRIPE_SECRET_KEY is not set in environment variables. " +
    "Please add it to your .env.local file."
  );
}

// Stripe client singleton
// Initialized once at module load time and reused across all requests
let stripeInstance: Stripe | null = null;

/**
 * Get or create the Stripe client instance (singleton pattern)
 */
function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set. Stripe features will be disabled.");
    return null;
  }
  
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover", // API version matching stripe package v20.0.0
      typescript: true,
    });
  }
  return stripeInstance;
}

/**
 * Server-side Stripe client instance
 * 
 * Use this in API routes, server actions, and server components.
 * 
 * ⚠️ May be null if STRIPE_SECRET_KEY is not set.
 * 
 * @example
 * ```ts
 * import { stripe } from "@/lib/stripe";
 * 
 * if (stripe) {
 *   const customer = await stripe.customers.create({
 *     email: "user@example.com",
 *   });
 * }
 * ```
 */
export const stripe = getStripeClient();

/**
 * Stripe publishable key for client-side use
 * 
 * ⚠️ This is safe to expose in client-side code.
 * Never log or expose STRIPE_SECRET_KEY.
 * 
 * @example
 * ```ts
 * import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripe";
 * 
 * // Use in client components with @stripe/stripe-js
 * ```
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  process.env.STRIPE_PUBLISHABLE_KEY || 
  "";

