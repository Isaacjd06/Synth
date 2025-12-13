/**
 * Development-Only Auto-Login Route
 * 
 * This route automatically logs in a development test user.
 * ONLY AVAILABLE IN DEVELOPMENT MODE.
 * 
 * Usage: Visit /api/auth/dev-login to automatically log in as dev user
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrCreateDevUser, isDevAuthEnabled, DEV_USER_EMAIL } from "@/lib/dev-auth";
import { createDevSession } from "@/lib/dev-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (!isDevAuthEnabled()) {
    return NextResponse.json(
      { error: "Development login is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    // Get or create dev user
    const devUser = await getOrCreateDevUser();

    // Create session for dev user
    const sessionToken = await createDevSession(devUser.id);

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Failed to create development session" },
        { status: 500 }
      );
    }

    // Set session cookie - NextAuth v5 cookie naming
    const cookieStore = await cookies();
    const baseUrl = request.nextUrl.origin;
    const isSecure = baseUrl.startsWith("https://") || process.env.NODE_ENV === "production";

    // NextAuth v5 uses "__Secure-" prefix for secure cookies, standard name for HTTP
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

    // Set the session cookie
    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Redirect to home page or callback URL
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
    const redirectUrl = new URL(callbackUrl, request.url);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Development login error:", error);
    return NextResponse.json(
      { 
        error: "Failed to log in development user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
