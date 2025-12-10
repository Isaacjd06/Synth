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

// Re-export types from client-safe version for server-side compatibility
export type { SubscriptionPlan, SubscriptionUsage, SubscriptionState } from "./subscription-client";

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

