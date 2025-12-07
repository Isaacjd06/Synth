/**
 * User Setup Utilities for Google OAuth
 * 
 * Handles user initialization, profile updates, and trial setup
 * for users logging in with Google OAuth.
 */

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
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
      trialEndsAt?: Date;
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

    // Set up 3-day trial for new users
    if (isNewUser) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3); // 3-day trial
      updateData.trialEndsAt = trialEndsAt;
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
        trial_ends_at: updateData.trialEndsAt,
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
      select: { stripeCustomerId: true },
    });

    if (!user) {
      return; // User doesn't exist yet
    }

    // Create Stripe customer if user doesn't have one
    if (!user.stripeCustomerId && email) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
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
      select: { created_at: true, trialEndsAt: true, subscriptionStatus: true },
    });

    if (!user) {
      return false;
    }

    // Check if user was created in the last 30 seconds
    const createdAgo = new Date().getTime() - new Date(user.created_at).getTime();
    const isRecentlyCreated = createdAgo < 30000; // 30 seconds

    // Also consider new if no trial and no subscription
    const hasNoTrialOrSubscription =
      !user.trialEndsAt && (!user.subscriptionStatus || user.subscriptionStatus === "inactive");

    return isRecentlyCreated || hasNoTrialOrSubscription;
  } catch (error: unknown) {
    logError("lib/auth-user-setup (isNewUser)", error as Error, { userId });
    return false;
  }
}

