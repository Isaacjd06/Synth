/**
 * Development Authentication Helpers
 * 
 * These utilities enable automatic authentication in development mode
 * to bypass OAuth setup requirements for local testing.
 * 
 * ONLY WORKS IN DEVELOPMENT - Automatically disabled in production
 */

import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { isDevAuthEnabled as isDevAuth } from "@/lib/runtime-utils";

/**
 * Development test user credentials
 * This user is automatically created and used for dev authentication
 */
export const DEV_USER_EMAIL = "dev@localhost.test";
export const DEV_USER_NAME = "Development User";

/**
 * Check if development authentication is enabled
 * @deprecated Import from @/lib/runtime-utils instead (Edge Runtime safe)
 */
export function isDevAuthEnabled(): boolean {
  return isDevAuth();
}

/**
 * Get or create the development test user
 * This user is automatically created for local development
 */
export async function getOrCreateDevUser() {
  // Check if dev auth is enabled
  if (!isDevAuthEnabled()) {
    throw new Error("Development authentication is only available in development mode");
  }

  // Try to find existing dev user
  let devUser = await prisma.user.findUnique({
    where: { email: DEV_USER_EMAIL },
  });

  // Create dev user if it doesn't exist
  if (!devUser) {
    // Import crypto only when needed (not at module level) to avoid Edge Runtime issues
    const { randomUUID } = await import("crypto");

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 365); // 1 year trial for dev

    devUser = await prisma.user.create({
      data: {
        id: randomUUID(), // Generate unique ID for the user
        email: DEV_USER_EMAIL,
        name: DEV_USER_NAME,
        email_verified: true,
        provider: "dev",
        trial_ends_at: trialEndsAt,
        subscription_status: "trialing", // Give dev user full access
        subscriptionStatus: "SUBSCRIBED", // Dev user always has access
        // Set a fake Google ID for compatibility
        google_id: `dev-${randomUUID()}`,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(DEV_USER_NAME)}&background=0ea5e9&color=fff`,
      },
    });
  }

  return devUser;
}

/**
 * Ensure dev user has an Account entry for NextAuth compatibility
 */
export async function ensureDevAccount(userId: string) {
  // Check if account exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider: "dev",
    },
  });

  if (!existingAccount) {
    // Create a fake account entry for NextAuth compatibility
    await prisma.account.create({
      data: {
        userId,
        type: "oauth",
        provider: "dev",
        providerAccountId: `dev-${userId}`,
      },
    });
  }
}

/**
 * Create a NextAuth session for the development user
 * This creates a proper session that works with NextAuth's session management
 */
export async function createDevSession(userId: string): Promise<string | null> {
  try {
    // Import crypto only when needed (not at module level) to avoid Edge Runtime issues
    const { randomUUID } = await import("crypto");

    // Ensure account exists for NextAuth compatibility
    await ensureDevAccount(userId);

    // Create a session token (NextAuth uses UUIDs for session tokens)
    const sessionToken = randomUUID();
    
    // Calculate expiration (30 days, matching NextAuth default)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    // Create session in database
    await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });

    return sessionToken;
  } catch (error) {
    console.error("Error creating dev session:", error);
    return null;
  }
}
