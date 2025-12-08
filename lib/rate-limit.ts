import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Initialize Upstash Redis client
// Validate environment variables at module load time
// In development, allow missing Redis vars (rate limiting will be disabled)
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for rate limiting. " +
      "Please set these environment variables."
    );
  } else {
    console.warn(
      "⚠️  UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. " +
      "Rate limiting is DISABLED in development mode."
    );
  }
}

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Creates a rate limiter instance
 * @param identifier - Unique identifier for this rate limiter (e.g., "chat", "workflow-runs")
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns Configured rate limiter instance (or null if Redis is not configured)
 */
export function createRateLimiter(
  identifier: string,
  limit: number,
  windowSeconds: number,
) {
  if (!redis) {
    // In development without Redis, return null (rate limiting disabled)
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: `ratelimit:${identifier}`,
  });
}

/**
 * Helper function to check rate limit and throw error response if exceeded
 * Identifies user by session.user.id if available, otherwise falls back to IP address
 * @param req - Next.js Request object
 * @param limiter - Rate limiter instance from createRateLimiter (can be null in dev)
 * @throws NextResponse with 429 status if rate limit exceeded
 */
export async function rateLimitOrThrow(
  req: Request,
  limiter: Ratelimit | null,
): Promise<void> {
  // Skip rate limiting if limiter is not configured (development mode)
  if (!limiter) {
    return;
  }

  // Try to get user ID from session
  let identifier: string;

  try {
    const session = await auth();
    if (session?.user?.id) {
      identifier = `user:${session.user.id}`;
    } else {
      // Fallback to IP address
      identifier = getClientIP(req);
    }
  } catch {
    // If auth fails, use IP address
    identifier = getClientIP(req);
  }

  // Check rate limit
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const errorResponse = NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
    // Add rate limit headers for transparency
    errorResponse.headers.set("X-RateLimit-Limit", limit.toString());
    errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
    errorResponse.headers.set(
      "X-RateLimit-Reset",
      new Date(reset).toISOString(),
    );
    // In Next.js, throwing a NextResponse works correctly in API routes
    throw errorResponse;
  }
}

/**
 * Extracts client IP address from request
 * Checks common headers used by proxies and load balancers
 */
function getClientIP(req: Request): string {
  // Check for IP in common proxy headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwarded.split(",").map((ip: string) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to unknown if IP cannot be determined
  return "unknown";
}

// Rate limit defaults
export const RATE_LIMITS = {
  chat: createRateLimiter("chat", 20, 60), // 20 requests per minute
  workflowRuns: createRateLimiter("workflow-runs", 10, 60), // 10 requests per minute
  memoryWrites: createRateLimiter("memory-writes", 15, 60), // 15 requests per minute
} as const;

