import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { customPrismaAdapter } from "@/lib/prisma-adapter-wrapper";
import { logAudit } from "@/lib/audit";
import { logError } from "@/lib/error-logger";
import { validateEnvOrThrow } from "@/lib/env";
import {
  setupUserAfterLogin,
  ensureStripeCustomer,
  isNewUser,
} from "@/lib/auth-user-setup";

// Validate environment variables at module load time
// This ensures the app fails fast if required env vars are missing
if (process.env.NODE_ENV !== "test") {
  try {
    validateEnvOrThrow();
  } catch (error) {
    // In development, log the error but don't crash (allows for hot reload)
    if (process.env.NODE_ENV === "development") {
      console.error("⚠️  Environment validation error:", error);
    } else {
      // In production, throw to prevent app from starting
      throw error;
    }
  }
}

// Validate AUTH_SECRET is set
if (!process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET is required. Please set it in your .env.local file.\n" +
    "Generate one with: openssl rand -base64 32"
  );
}

// Test database connection on module load (only in Node.js runtime, not Edge)
// Edge runtime (middleware) doesn't support Prisma Client
if (typeof EdgeRuntime === "undefined") {
  prisma.$connect().catch((error) => {
    console.error("[AUTH] Failed to connect to database:", error);
  });
}

// Validate Google OAuth credentials before creating provider
// This prevents NextAuth Configuration errors
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || googleClientId.trim() === "") {
  const errorMsg = "GOOGLE_CLIENT_ID is required but not set. Please set it in your .env.local file.";
  console.error(`[AUTH] ❌ ${errorMsg}`);
  if (process.env.NODE_ENV !== "development") {
    throw new Error(errorMsg);
  }
}

if (!googleClientSecret || googleClientSecret.trim() === "") {
  const errorMsg = "GOOGLE_CLIENT_SECRET is required but not set. Please set it in your .env.local file.";
  console.error(`[AUTH] ❌ ${errorMsg}`);
  if (process.env.NODE_ENV !== "development") {
    throw new Error(errorMsg);
  }
}

// Build providers array - always include Google provider if credentials exist
// Don't conditionally build providers array - NextAuth needs it at initialization
const providers = [];

// Always try to add Google provider - NextAuth will handle validation
if (googleClientId && googleClientSecret) {
  console.log("[AUTH] ✅ Configuring Google OAuth provider");
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // Explicit OIDC configuration for NextAuth v5 compliance
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile", // Explicit scopes for OIDC
        },
      },
      // Ensure proper profile mapping
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    })
  );
} else {
  console.warn("[AUTH] ⚠️  Google OAuth provider not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

// Log provider configuration for debugging
console.log("[AUTH] Initializing NextAuth with", providers.length, "provider(s)");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customPrismaAdapter,
  secret: process.env.AUTH_SECRET,
  basePath: "/api/auth",
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("[AUTH] signIn: Called with user:", user?.email, "provider:", account?.provider);

      // Always allow sign-in - PrismaAdapter will create the user if needed
        if (!user?.email || !account) {
          console.log("[AUTH] signIn: Missing user email or account, allowing adapter to handle");
          return true; // Let adapter handle it
        }

        console.log("[AUTH] signIn: Processing sign-in for", user.email, "provider:", account.provider);

      // For Google OAuth, save profile data after adapter creates user
      if (account.provider === "google") {
        try {
          // Use a longer delay to ensure PrismaAdapter has created the user
        setTimeout(async () => {
          try {
              console.log("[AUTH] signIn: Checking for user in database...");
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
                select: { id: true, created_at: true },
            });

            if (dbUser) {
                console.log("[AUTH] signIn: User found in database:", dbUser.id);
              const isNew =
                dbUser.created_at &&
                  new Date().getTime() - new Date(dbUser.created_at).getTime() < 10000; // 10 seconds

                if (isNew) {
                  console.log("[AUTH] signIn: New user detected, setting up profile...");
                }

                // Save Google profile data
              await setupUserAfterLogin(
                dbUser.id,
                {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
                {
                  picture: user.image || (profile as { picture?: string })?.picture,
                    email_verified: true,
                },
                isNew
              );

                // Create Stripe customer if new user
                if (isNew) {
                  await ensureStripeCustomer(dbUser.id, user.email!).catch((err) => {
                    console.error("[AUTH] signIn: Failed to create Stripe customer:", err);
                  });
                }
              } else {
                console.error("[AUTH] signIn: User not found in database after sign-in! Email:", user.email);
                logError("lib/auth (signIn callback - user not found)", new Error("User not created by adapter"), {
                  email: user.email,
                });
            }
          } catch (error) {
              // Log but don't block sign-in
              console.error("[AUTH] signIn: Error in user setup:", error);
              logError("lib/auth (signIn callback - user setup)", error as Error, {
              email: user.email,
            });
          }
          }, 1000); // Increased delay to 1 second to ensure adapter has created user
        } catch (error) {
          // Log but don't block sign-in
          console.error("[AUTH] signIn: Error in signIn callback:", error);
        }
      }

      return true;
      } catch (error) {
        console.error("[AUTH] signIn: CRITICAL ERROR in signIn callback:", error);
        // Always allow sign-in even if there's an error
      return true;
      }
    },
    async session({ session, user }) {
      try {
        console.log("[AUTH] session: Called for user:", user?.id);

        if (!session.user || !user) {
          console.log("[AUTH] session: Missing session.user or user object");
          return session;
        }

        console.log("[AUTH] session: Creating session for user:", user.id);

        // Always include user ID
        session.user.id = user.id;

        // Populate all user fields from database (safely with nullish coalescing)
        session.user.google_id = user.google_id ?? null;
        session.user.avatar_url = user.avatar_url ?? null;
        session.user.email_verified = user.email_verified ?? null;
        session.user.provider = user.provider ?? null;
        session.user.last_login_at = user.last_login_at ?? null;

        // Populate Stripe subscription fields (safely with nullish coalescing)
        session.user.stripeCustomerId = user.stripe_customer_id ?? null;
        session.user.stripeSubscriptionId = user.stripe_subscription_id ?? null;
        session.user.subscriptionStatus = user.subscription_status ?? null;
        session.user.plan = user.subscription_plan ?? null;
        session.user.subscriptionStartedAt = user.subscription_started_at ?? null;
        session.user.subscriptionEndsAt = user.subscription_ends_at ?? null;
        session.user.trialEndsAt = user.trial_ends_at ?? null;
        session.user.addOns = user.subscription_add_ons ?? null;
        session.user.stripePaymentMethodId = user.stripe_payment_method_id ?? null;

        // Update last_login_at (fire-and-forget, don't await)
        prisma.user
          .update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
          })
          .catch((err) => {
            // Silently ignore errors - non-critical
            console.error("Failed to update last_login_at:", err);
          });

        // Ensure user profile is up to date (fire-and-forget, don't await)
        // Run asynchronously to not block session creation
        (async () => {
          try {
            const accountData = await prisma.account.findFirst({
              where: {
                userId: user.id,
                provider: "google",
              },
              select: {
                providerAccountId: true,
              },
            });

            if (accountData) {
              const isNew = await isNewUser(user.id);
              await setupUserAfterLogin(
                user.id,
                {
                  provider: "google",
                  providerAccountId: accountData.providerAccountId,
                },
                {
                  picture: user.avatar_url || session.user.image || undefined,
                  email_verified: user.email_verified !== false,
                },
                isNew
              );
            }

          // Ensure Stripe customer exists
            if (session.user.email) {
              await ensureStripeCustomer(user.id, session.user.email);
            }
          } catch (error) {
            // Log but don't throw - user setup is non-critical
            console.error("Error in async user setup:", error);
          }
        })();
      } catch (error) {
        // If session callback fails, log but return session anyway
        console.error("Error in session callback:", error);
        logError("lib/auth (session callback)", error as Error, {
          userId: user?.id,
        });
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        console.log("[AUTH] redirect: Called with url:", url, "baseUrl:", baseUrl);
        
        // Only allow NextAuth callback URLs to pass through (not error pages)
        // Error pages should redirect to dashboard instead
        if (url.includes("/api/auth/callback") || url.includes("/api/auth/signin")) {
          console.log("[AUTH] redirect: Allowing NextAuth callback/signin URL:", url);
          return url;
        }
        
        // If it's an error page, redirect to dashboard instead
        if (url.includes("/api/auth/error")) {
          console.log("[AUTH] redirect: Error page detected, redirecting to dashboard instead");
          const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || baseUrl || "http://localhost:3000";
          return `${appUrl.replace(/\/$/, "")}/dashboard`;
        }
        
        // Get base URL from environment or use provided baseUrl
        const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || baseUrl || "http://localhost:3000";
        const cleanAppUrl = appUrl.replace(/\/$/, "");
        
        // If url is relative, make it absolute
        if (url.startsWith("/")) {
          const fullUrl = `${cleanAppUrl}${url}`;
          console.log("[AUTH] redirect: Relative URL, returning:", fullUrl);
          return fullUrl;
        }
        
        // If url is absolute and on the same origin, allow it
        try {
          const urlObj = new URL(url);
          const appUrlObj = new URL(appUrl);
          if (urlObj.origin === appUrlObj.origin) {
            console.log("[AUTH] redirect: Same origin URL, allowing:", url);
            return url;
          }
        } catch {
          // Invalid URL, fall through to default
        }
        
        // Default: redirect to dashboard after successful signin
        const dashboardUrl = `${cleanAppUrl}/dashboard`;
        console.log("[AUTH] redirect: Default redirect to dashboard:", dashboardUrl);
        return dashboardUrl;
      } catch (error) {
        // If redirect callback fails, fall back to dashboard
        console.error("[AUTH] redirect: Error in redirect callback:", error);
        const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || baseUrl || "http://localhost:3000";
        return `${appUrl.replace(/\/$/, "")}/dashboard`;
      }
    },
  },
  // Remove pages configuration - v5 handles this differently
  // pages: {
  //   signIn: "/",
  // },
  session: {
    strategy: "database",
  },
});
