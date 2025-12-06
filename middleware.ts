import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - allow access
  const publicRoutes = ["/", "/waitlist"];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/api/auth/");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require admin access
  const protectedRoutes = [
    "/dashboard",
    "/chat",
    "/workflows",
    "/executions",
    "/settings",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    try {
      const session = await auth();

      // Check if user is authenticated
      if (!session || !session.user) {
        const signInUrl = new URL("/api/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Check if user is admin
      if (session.user.id !== SYSTEM_USER_ID) {
        // Non-admin users are blocked
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      // Log error and redirect to sign-in on auth failure
      console.error("Auth middleware error:", error);
      const signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      signInUrl.searchParams.set("error", "AuthError");
      return NextResponse.redirect(signInUrl);
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

