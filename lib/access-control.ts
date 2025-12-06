/**
 * Centralized Access Control for Synth
 * 
 * Provides utilities to determine user access levels and check permissions
 * based on subscription status and trial periods.
 * 
 * Access Levels:
 * - "full": User has active subscription or valid trial (can use all features)
 * - "minimal": User exists but no subscription/trial (read-only, billing access)
 * - "none": Unauthenticated (public routes only)
 */

import { prisma } from "@/lib/prisma";

export type AccessLevel = "none" | "minimal" | "full";

export interface UserAccessInfo {
  accessLevel: AccessLevel;
  hasFullAccess: boolean;
  hasMinimalAccess: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
}

/**
 * Check if a subscription status indicates active access
 * Includes: "active", "trialing", and valid trial period
 */
function isSubscriptionStatusActive(
  status: string | null | undefined,
  trialEndsAt: Date | null | undefined,
): boolean {
  if (!status) {
    // Check if trial is still valid
    if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      return true;
    }
    return false;
  }

  const statusLower = status.toLowerCase();

  // Explicitly blocked statuses
  const blockedStatuses = [
    "none",
    "canceled",
    "incomplete_expired",
    "incomplete",
    "unpaid",
  ];

  if (blockedStatuses.includes(statusLower)) {
    // Even if blocked, check trial
    if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      return true;
    }
    return false;
  }

  // Allow active, trialing, and past_due (they still have access)
  const allowedStatuses = ["active", "trialing", "past_due"];
  return allowedStatuses.includes(statusLower);
}

/**
 * Get user access level from database
 * 
 * @param userId - User ID
 * @returns User access information
 */
export async function getUserAccessLevel(
  userId: string,
): Promise<UserAccessInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) {
    return {
      accessLevel: "none",
      hasFullAccess: false,
      hasMinimalAccess: false,
      isInTrial: false,
      trialEndsAt: null,
      subscriptionStatus: null,
    };
  }

  const hasFullAccess = isSubscriptionStatusActive(
    user.subscriptionStatus,
    user.trialEndsAt,
  );

  const isInTrial =
    user.trialEndsAt !== null && new Date(user.trialEndsAt) > new Date();

  return {
    accessLevel: hasFullAccess ? "full" : "minimal",
    hasFullAccess,
    hasMinimalAccess: !hasFullAccess, // User exists but no access
    isInTrial,
    trialEndsAt: user.trialEndsAt,
    subscriptionStatus: user.subscriptionStatus,
  };
}

/**
 * Check if user has full access (active subscription or valid trial)
 * 
 * @param userId - User ID
 * @returns true if user has full access
 */
export async function hasFullAccess(userId: string): Promise<boolean> {
  const accessInfo = await getUserAccessLevel(userId);
  return accessInfo.hasFullAccess;
}

/**
 * Check if user has minimal access (can view but not modify)
 * 
 * @param userId - User ID
 * @returns true if user has minimal access
 */
export async function hasMinimalAccess(userId: string): Promise<boolean> {
  const accessInfo = await getUserAccessLevel(userId);
  return accessInfo.hasMinimalAccess;
}

/**
 * Check if user is within their 3-day free trial period
 * 
 * @param userId - User ID
 * @returns true if user is in trial
 */
export async function isInTrialPeriod(userId: string): Promise<boolean> {
  const accessInfo = await getUserAccessLevel(userId);
  return accessInfo.isInTrial;
}

/**
 * Get access level from session user data (for middleware/quick checks)
 * This avoids a database query but may be slightly stale
 * 
 * @param subscriptionStatus - Subscription status from session
 * @param trialEndsAt - Trial end date from session
 * @returns Access level
 */
export function getAccessLevelFromSession(
  subscriptionStatus: string | null | undefined,
  trialEndsAt: Date | string | null | undefined,
): AccessLevel {
  const trialEnd =
    trialEndsAt instanceof Date
      ? trialEndsAt
      : trialEndsAt
        ? new Date(trialEndsAt)
        : null;

  const hasFull = isSubscriptionStatusActive(subscriptionStatus, trialEnd);
  return hasFull ? "full" : "minimal";
}

