import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import {
  getUserAccessLevel,
  hasFullAccess,
  type UserAccessInfo,
} from "@/lib/access-control";

export interface AuthResult {
  userId: string;
  isSystemUser: boolean;
  hasValidSubscription: boolean;
}

/**
 * Auth result with access info
 */
export interface AuthResultWithAccess extends AuthResult {
  accessInfo: UserAccessInfo;
}

/**
 * Authenticates user without subscription check (for minimal access routes)
 * Supports both API key authentication and NextAuth session
 * Returns null if unauthenticated, or AuthResult if authenticated
 */
export async function authenticateUser(): Promise<NextResponse | AuthResult> {
  // 1. Check for API key authentication first
  const headersList = await headers();
  const apiKey = headersList.get("x-api-key");

  if (apiKey) {
    try {
      const userId = await verifyApiKey(apiKey);

      if (!userId) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get access info for context
      const accessInfo = await getUserAccessLevel(userId);

      return {
        userId,
        isSystemUser: false,
        hasValidSubscription: accessInfo.hasFullAccess,
      };
    } catch (error: unknown) {
      const err = error as Error;
      logError("lib/auth-helpers (API key auth)", err, {
        hasApiKey: !!apiKey,
      });
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 },
      );
    }
  }

  // 2. Fall back to NextAuth session authentication
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get access info for context
    const accessInfo = await getUserAccessLevel(userId);

    return {
      userId,
      isSystemUser: false,
      hasValidSubscription: accessInfo.hasFullAccess,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logError("lib/auth-helpers (NextAuth session)", err);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}

/**
 * Require active subscription for protected API routes
 * Returns NextResponse with error if subscription is not active, or null if allowed
 */
export async function requireActiveSubscription(
  userId: string,
  hostname?: string,
): Promise<NextResponse | null> {
  const hasAccess = await hasFullAccess(userId);

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        code: "NO_ACTIVE_SUBSCRIPTION",
        message: "You must have an active subscription to use this feature.",
      },
      { status: 403 },
    );
  }

  return null; // Subscription is active, allow access
}

/**
 * Authenticates user and checks subscription status
 * Supports both API key authentication (via x-api-key header) and NextAuth session
 * Returns null if unauthenticated, or AuthResult if authenticated
 * 
 * NOTE: This function requires full access (paid or trial). For routes that allow
 * minimal access, use `authenticateUser()` instead.
 */
export async function authenticateAndCheckSubscription(): Promise<
  NextResponse | AuthResult
> {
  // Extract hostname from headers for development detection
  const headersList = await headers();
  const hostname = headersList.get("host") || undefined;
  
  // 1. Check for API key authentication first
  const apiKey = headersList.get("x-api-key");

  if (apiKey) {
    try {
      const userId = await verifyApiKey(apiKey);

      if (!userId) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      // Check subscription access
      const subscriptionCheck = await requireActiveSubscription(userId, hostname);
      if (subscriptionCheck) {
        return subscriptionCheck;
      }

      return {
        userId,
        isSystemUser: false,
        hasValidSubscription: true,
      };
    } catch (error: unknown) {
      const err = error as Error;
      logError("lib/auth-helpers (API key auth)", err, {
        hasApiKey: !!apiKey,
      });
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 },
      );
    }
  }

  // 2. Fall back to NextAuth session authentication
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check subscription access
    const subscriptionCheck = await requireActiveSubscription(userId, hostname);
    if (subscriptionCheck) {
      return subscriptionCheck;
    }

    return {
      userId,
      isSystemUser: false,
      hasValidSubscription: true,
    };
  } catch (error: unknown) {
    const err = error as Error;
    logError("lib/auth-helpers (NextAuth session)", err);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}

/**
 * Authenticate user and get access info (for routes that need to handle minimal access)
 * Returns AuthResultWithAccess which includes access level information
 */
export async function authenticateWithAccessInfo(): Promise<
  NextResponse | AuthResultWithAccess
> {
  const authResult = await authenticateUser();
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const accessInfo = await getUserAccessLevel(authResult.userId);

  return {
    ...authResult,
    accessInfo,
  };
}
