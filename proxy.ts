import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API routes - let them handle their own authentication
  // They will return JSON errors, not HTML redirects
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public routes - allow access
  const publicRoutes = ["/", "/waitlist", "/pricing"];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/waitlist") ||
    pathname.startsWith("/api/webhooks/stripe");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require authentication (but allow minimal access)
  const protectedRoutes = [
    "/dashboard",
    "/chat",
    "/workflows",
    "/executions",
    "/settings",
    "/knowledge",
    "/billing",
    "/checkout",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    try {
      // 1. Check authentication (required for all protected routes)
      const session = await auth();

      if (!session || !session.user) {
        // Redirect to home page (where sign-in button is)
        const signInUrl = new URL("/", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // 2. Authenticated users can access protected routes
      // Individual API routes will handle access control (full vs minimal)
      // For pages, we allow access - they can show minimal UI if needed
      return NextResponse.next();
    } catch (error) {
      // Log error and redirect to home page on auth failure
      console.error("Auth proxy error:", error);

      // Redirect to home page (where sign-in button is)
      const signInUrl = new URL("/", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      signInUrl.searchParams.set("error", "AuthError");
      return NextResponse.redirect(signInUrl);
    }
  }

  // Redirect authenticated users from landing page to dashboard
  if (pathname === "/") {
    try {
      const session = await auth();
      if (session?.user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // If auth check fails, allow landing page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

