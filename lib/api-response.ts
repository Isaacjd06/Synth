/**
 * Unified API Response Helpers
 * 
 * Ensures all API routes return consistent JSON responses
 */

import { NextResponse } from "next/server";
import type { SubscriptionPlan } from "./subscription-client";

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data?: T;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Create a successful API response
 */
export function success<T = unknown>(
  data?: T,
  additionalFields?: Record<string, unknown>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      ok: true,
      ...(data !== undefined && { data }),
      ...additionalFields,
    },
    { status: 200 }
  );
}

/**
 * Create an error API response
 */
export function error(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: unknown;
  }
): NextResponse<ApiErrorResponse> {
  const status = options?.status || 400;
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(options?.code && { code: options.code }),
      ...(options?.details && { details: options.details }),
    },
    { status }
  );
}

/**
 * Require a specific subscription plan level
 * Returns an error response if user doesn't have the required plan
 */
export function requirePlan(
  userPlan: SubscriptionPlan | string | null | undefined,
  requiredPlan: "starter" | "pro" | "agency"
): NextResponse<ApiErrorResponse> | null {
  // Check for free or none plans
  if (!userPlan || userPlan === "free" || userPlan === "none") {
    return error(
      `This feature requires a ${requiredPlan} plan or higher.`,
      {
        status: 403,
        code: "SUBSCRIPTION_REQUIRED",
        details: { requiredPlan, currentPlan: userPlan || "free" },
      }
    );
  }

  const planHierarchy: SubscriptionPlan[] = ["free", "starter", "pro", "agency"];
  const userPlanIndex = planHierarchy.indexOf(userPlan as SubscriptionPlan);
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

  // If plan not found in hierarchy, deny access
  if (userPlanIndex === -1) {
    return error(
      `This feature requires a ${requiredPlan} plan or higher.`,
      {
        status: 403,
        code: "INVALID_PLAN",
        details: { requiredPlan, currentPlan: userPlan },
      }
    );
  }

  if (userPlanIndex < requiredPlanIndex) {
    return error(
      `This feature requires a ${requiredPlan} plan or higher.`,
      {
        status: 403,
        code: "INSUFFICIENT_PLAN",
        details: { requiredPlan, currentPlan: userPlan },
      }
    );
  }

  return null; // User has required plan
}

