/**
 * Subscription State Types and Utilities (Server-side)
 * 
 * Central types and utilities for subscription state management
 * 
 * NOTE: For client components, use @/lib/subscription-client instead
 * to avoid bundling Prisma/Node.js modules in the browser.
 */

import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import type { NextResponse } from "next/server";

// Re-export types from client-safe version for server-side compatibility
export type { SubscriptionPlan, SubscriptionUsage, SubscriptionState } from "./subscription-client";
import type { SubscriptionPlan } from "./subscription-client";

// Re-export utility functions that don't use Prisma
export { mapPlanToSubscriptionPlan, getLogRetentionDays, getPlanDisplayName, getPlanBadgeColors } from "./subscription-client";

/**
 * Get display name for a plan
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "agency":
      return "Agency";
    case "none":
    default:
      return "No Active Subscription";
  }
}

/**
 * Get color classes for plan badge
 */
export function getPlanBadgeColors(plan: SubscriptionPlan): {
  bg: string;
  text: string;
  border: string;
} {
  switch (plan) {
    case "starter":
      return {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
      };
    case "pro":
      return {
        bg: "bg-primary/20",
        text: "text-primary",
        border: "border-primary/30",
      };
    case "agency":
      return {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        border: "border-purple-500/30",
      };
    case "none":
    default:
      return {
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-border",
      };
  }
}

/**
 * Determine if a plan has access to a feature
 */
export function hasFeatureAccess(
  currentPlan: SubscriptionPlan,
  requiredPlan: SubscriptionPlan
): boolean {
  if (currentPlan === "none") return false;
  if (requiredPlan === "none") return true;
  
  const planHierarchy: SubscriptionPlan[] = ["none", "starter", "pro", "agency"];
  const currentIndex = planHierarchy.indexOf(currentPlan);
  const requiredIndex = planHierarchy.indexOf(requiredPlan);
  
  return currentIndex >= requiredIndex;
}

/**
 * Get log retention days for a plan
 */
export function getLogRetentionDays(plan: SubscriptionPlan): number {
  switch (plan) {
    case "starter":
      return 7;
    case "pro":
      return 30;
    case "agency":
      return 90;
    case "none":
    default:
      return 0;
  }
}

/**
 * Get subscription status for a user
 * 
 * @param userId - User ID
 * @returns SubscriptionStatus enum value (SUBSCRIBED or UNSUBSCRIBED)
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return user.subscriptionStatus;
}

/**
 * Get effective subscription plan for a user
 * 
 * This function returns the plan that should be used for entitlement checks.
 * During trial periods, users get "agency" plan access (full features).
 * After trial, returns their actual subscription plan.
 * 
 * @param userId - User ID
 * @returns Effective subscription plan (free, starter, pro, or agency)
 */
export async function getEffectiveSubscriptionPlan(
  userId: string
): Promise<SubscriptionPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscription_plan: true,
      trial_ends_at: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // During trial, treat user as if they have agency plan (all integrations)
  const isInTrial = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
  
  if (isInTrial) {
    return "agency";
  }

  // Return actual plan, defaulting to "free" if null
  return (user.subscription_plan || "free") as SubscriptionPlan;
}

/**
 * Get current user with subscription information
 * 
 * @param userId - User ID
 * @returns User with subscription plan and status
 */
export async function getCurrentUserWithSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripe_customer_id: true,
      stripe_subscription_id: true,
      subscription_plan: true,
      pending_subscription_plan: true,
      subscriptionStatus: true,
      subscription_status: true,
      subscription_renewal_at: true,
      trial_ends_at: true,
      has_active_payment_method: true,
      stripe_payment_method_id: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    stripe_customer_id: user.stripe_customer_id,
    stripe_subscription_id: user.stripe_subscription_id,
    subscription_plan: (user.subscription_plan || "free") as SubscriptionPlan,
    pending_subscription_plan: user.pending_subscription_plan,
    subscriptionStatus: user.subscriptionStatus,
    subscription_status: user.subscription_status,
    subscription_renewal_at: user.subscription_renewal_at,
    trial_ends_at: user.trial_ends_at,
    has_active_payment_method: user.has_active_payment_method,
    stripe_payment_method_id: user.stripe_payment_method_id,
  };
}

/**
 * Require subscription level for a user
 * Returns error response if user doesn't have required plan
 * 
 * @param userId - User ID
 * @param requiredPlan - Minimum required plan level
 * @returns Error response if plan insufficient, null if allowed
 */
export async function requireSubscriptionLevel(
  userId: string,
  requiredPlan: "starter" | "pro" | "agency"
): Promise<NextResponse | null> {
  const { requirePlan } = await import("./api-response");
  const effectivePlan = await getEffectiveSubscriptionPlan(userId);
  
  const planCheck = requirePlan(effectivePlan, requiredPlan);
  if (planCheck) {
    return planCheck;
  }
  
  return null;
}

/**
 * Set subscription status for a user
 * 
 * This function allows manual override of subscription status for testing purposes.
 * In production, this should typically be set automatically by Stripe webhooks or backend logic.
 * 
 * @param userId - User ID
 * @param status - SubscriptionStatus enum value ("SUBSCRIBED" or "UNSUBSCRIBED")
 * @returns Updated user with subscriptionStatus
 */
export async function setUserSubscriptionStatus(
  userId: string,
  status: "SUBSCRIBED" | "UNSUBSCRIBED"
): Promise<{ id: string; subscriptionStatus: SubscriptionStatus }> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: status,
    },
    select: {
      id: true,
      subscriptionStatus: true,
    },
  });

  return updatedUser;
}

