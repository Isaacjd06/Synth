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
import { SubscriptionStatus } from "@prisma/client";

export type AccessLevel = "none" | "minimal" | "full";

export interface UserAccessInfo {
  accessLevel: AccessLevel;
  hasFullAccess: boolean;
  hasMinimalAccess: boolean;
  isInTrial: boolean;
  trialEndsAt: Date | null;
  subscriptionStatus: SubscriptionStatus | string | null;
}

/**
 * Check if a subscription status indicates active access
 * Supports both enum (SubscriptionStatus) and legacy string values for backward compatibility
 * Includes: SUBSCRIBED enum value, "active", "trialing", and valid trial period
 */
function isSubscriptionStatusActive(
  status: SubscriptionStatus | string | null | undefined,
  trialEndsAt: Date | null | undefined,
): boolean {
  if (!status) {
    // Check if trial is still valid
    if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      return true;
    }
    return false;
  }

  // Check for enum value first (new way)
  if (status === SubscriptionStatus.SUBSCRIBED) {
    return true;
  }

  if (status === SubscriptionStatus.UNSUBSCRIBED) {
    // Even if unsubscribed, check trial
    if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      return true;
    }
    return false;
  }

  // Legacy string support for backward compatibility
  const statusLower = typeof status === "string" ? status.toLowerCase() : "";

  // Explicitly blocked statuses
  const blockedStatuses = [
    "none",
    "canceled",
    "incomplete_expired",
    "incomplete",
    "unpaid",
    "unsubscribed",
  ];

  if (blockedStatuses.includes(statusLower)) {
    // Even if blocked, check trial
    if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
      return true;
    }
    return false;
  }

  // Allow active, trialing, and past_due (they still have access)
  const allowedStatuses = ["active", "trialing", "past_due", "subscribed"];
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
 * IMPORTANT: This function now requires an ACTIVE PAID SUBSCRIPTION.
 * Trial periods are no longer sufficient - users must have a paid plan.
 * 
 * @param userId - User ID
 * @returns true if user has active paid subscription
 */
export async function hasFullAccess(userId: string): Promise<boolean> {
  const accessInfo = await getUserAccessLevel(userId);
  
  // Require active subscription (not just trial)
  // User must have subscription_status = "active" AND a valid plan
  if (!accessInfo.hasFullAccess) {
    return false;
  }
  
  // Additional check: ensure user has a subscription plan set
  // This ensures they're on a paid plan, not just in trial
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      subscriptionStatus: true,
      subscriptionPlan: true,
    },
  });
  
  if (!user) {
    return false;
  }
  
  // Must have active subscription status AND a plan
  // Check for enum value SUBSCRIBED or legacy string values
  const hasActiveStatus = 
    user.subscriptionStatus === SubscriptionStatus.SUBSCRIBED ||
    user.subscriptionStatus === "active" || 
    user.subscriptionStatus === "trialing";
  const hasPlan = !!user.subscriptionPlan && 
    (user.subscriptionPlan.toLowerCase().includes("starter") ||
     user.subscriptionPlan.toLowerCase().includes("pro") ||
     user.subscriptionPlan.toLowerCase().includes("agency"));

  return hasActiveStatus && hasPlan;
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

