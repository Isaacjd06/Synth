/**
 * User Setup Utilities for Google OAuth
 * 
 * Handles user initialization, profile updates, and trial setup
 * for users logging in with Google OAuth.
 */

import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import { logAudit } from "@/lib/audit";

/**
 * Setup user after Google OAuth login
 * 
 * @param userId - User ID
 * @param account - OAuth account data from NextAuth
 * @param profile - OAuth profile data from NextAuth
 * @param isNewUser - Whether this is a new user (first login)
 */
export async function setupUserAfterLogin(
  userId: string,
  account?: {
    provider?: string;
    providerAccountId?: string;
  } | null,
  profile?: {
    picture?: string;
    email_verified?: boolean;
  } | null,
  isNewUser: boolean = false
): Promise<void> {
  try {
    const updateData: {
      last_login_at: Date;
      google_id?: string;
      avatar_url?: string;
      email_verified?: boolean;
      provider?: string;
      trial_ends_at?: Date;
    } = {
      last_login_at: new Date(),
    };

    // Store Google profile data if available
    if (account?.provider === "google") {
      if (account.providerAccountId) {
        updateData.google_id = account.providerAccountId;
      }
      if (profile?.picture) {
        updateData.avatar_url = profile.picture;
      }
      // Google OAuth emails are verified by default
      updateData.email_verified = true;
      updateData.provider = "google";
    }

    // Set up 3-day trial for new users (only if they don't already have a trial)
    // Check if user already has a trial set
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { trial_ends_at: true, created_at: true },
    });
    
    // Set up 3-day trial if:
    // 1. This is marked as a new user, OR
    // 2. User was created in the last 5 minutes AND doesn't have a trial yet
    const shouldSetTrial = isNewUser || (
      existingUser &&
      !existingUser.trial_ends_at &&
      new Date().getTime() - new Date(existingUser.created_at).getTime() < 300000 // 5 minutes
    );
    
    if (shouldSetTrial && !existingUser?.trial_ends_at) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3-day trial from now
      trialEndsAt.setHours(23, 59, 59, 999); // Set to end of day for full 3 days
      updateData.trial_ends_at = trialEndsAt;
      console.log(`[AUTH] Setting up 3-day trial for user ${userId}, trial ends at: ${trialEndsAt.toISOString()}`);
    }

    // Update user with profile data and trial setup
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log audit event for new user creation
    if (isNewUser) {
      await logAudit("user.created", userId, {
        provider: account?.provider || "google",
        has_trial: true,
        trial_ends_at: updateData.trial_ends_at,
      }).catch(() => {
        // Ignore audit logging errors
      });
    }
  } catch (error: unknown) {
    logError("lib/auth-user-setup (setupUserAfterLogin)", error as Error, {
      userId,
      isNewUser,
    });
    // Don't throw - allow login to continue even if setup fails
  }
}

/**
 * Ensure Stripe customer exists for user
 * 
 * @param userId - User ID
 * @param email - User email
 */
export async function ensureStripeCustomer(
  userId: string,
  email: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripe_customer_id: true },
    });

    if (!user) {
      return; // User doesn't exist yet
    }

    // Create Stripe customer if user doesn't have one
    if (!user.stripe_customer_id && email) {
      try {
        // Dynamically import stripe to avoid module load errors if STRIPE_SECRET_KEY is missing
        const { stripe } = await import("@/lib/stripe");
        if (stripe) {
          const customer = await stripe.customers.create({
            email,
            metadata: { userId },
          });

          // Update user with Stripe customer ID
          await prisma.user.update({
            where: { id: userId },
            data: { stripe_customer_id: customer.id },
          });
        }
      } catch (stripeError) {
        // If Stripe fails (e.g., missing key), log but don't throw
        console.error("Failed to create Stripe customer:", stripeError);
        logError("lib/auth-user-setup (ensureStripeCustomer)", stripeError as Error, {
          userId,
          email,
        });
      }
    }
  } catch (error: unknown) {
    logError("lib/auth-user-setup (ensureStripeCustomer)", error as Error, {
      userId,
      email,
    });
    // Don't throw - Stripe customer creation is not critical for login
  }
}

/**
 * Check if user is new (created recently)
 * 
 * @param userId - User ID
 * @returns true if user was created in the last 30 seconds
 */
export async function isNewUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { created_at: true, trial_ends_at: true, subscription_status: true },
    });

    if (!user) {
      return false;
    }

    // Check if user was created in the last 30 seconds
    const createdAgo = new Date().getTime() - new Date(user.created_at).getTime();
    const isRecentlyCreated = createdAgo < 30000; // 30 seconds

    // Also consider new if no trial and no subscription
    const hasNoTrialOrSubscription =
      !user.trial_ends_at && (!user.subscription_status || user.subscription_status === "inactive");

    return isRecentlyCreated || hasNoTrialOrSubscription;
  } catch (error: unknown) {
    logError("lib/auth-user-setup (isNewUser)", error as Error, { userId });
    return false;
  }
}

