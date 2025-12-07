import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always allow sign-in - PrismaAdapter will create the user if needed
      // User profile setup happens asynchronously after adapter creates user
      if (user?.email && account?.provider === "google") {
        // Queue user setup to run after adapter creates user
        // This ensures we capture Google profile data (avatar, google_id, etc.)
        setTimeout(async () => {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
              select: {
                id: true,
                created_at: true,
                trialEndsAt: true,
                subscriptionStatus: true,
              },
            });

            if (dbUser) {
              const isNew =
                dbUser.created_at &&
                new Date().getTime() - new Date(dbUser.created_at).getTime() < 30000;

              await setupUserAfterLogin(
                dbUser.id,
                {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
                {
                  picture: user.image || (profile as { picture?: string })?.picture,
                  email_verified: true, // Google emails are verified
                },
                isNew
              );

              await ensureStripeCustomer(dbUser.id, user.email!);
            }
          } catch (error) {
            // Log but don't block - will retry on next login or session
            logError("lib/auth (signIn - async user setup)", error as Error, {
              email: user.email,
            });
          }
        }, 1000); // Wait 1 second for adapter to create user
      }
      return true;
    },
    async session({ session, user, trigger }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Populate extended user fields from database
        session.user.google_id = user.google_id;
        session.user.avatar_url = user.avatar_url;
        session.user.email_verified = user.email_verified;
        session.user.provider = user.provider;
        session.user.last_login_at = user.last_login_at;
        // Populate Stripe subscription fields (camelCase to match Prisma schema)
        session.user.stripeCustomerId = user.stripeCustomerId;
        session.user.stripeSubscriptionId = user.stripeSubscriptionId;
        session.user.subscriptionStatus = user.subscriptionStatus;
        session.user.plan = user.plan;
        session.user.subscriptionStartedAt = user.subscriptionStartedAt;
        session.user.subscriptionEndsAt = user.subscriptionEndsAt;
        session.user.trialEndsAt = user.trialEndsAt;
        session.user.addOns = user.addOns;
        session.user.stripePaymentMethodId = user.stripePaymentMethodId;

        // Setup user profile data and trial after login (runs asynchronously)
        // Fetch account info for Google profile data and set up user
        Promise.all([
          // Get Google account info and set up user profile
          prisma.account
            .findFirst({
              where: {
                userId: user.id,
                provider: "google",
              },
              select: {
                providerAccountId: true,
              },
            })
            .then(async (accountData) => {
              const isNew = await isNewUser(user.id);
              await setupUserAfterLogin(
                user.id,
                {
                  provider: "google",
                  providerAccountId: accountData?.providerAccountId || user.google_id || undefined,
                },
                {
                  picture: user.avatar_url || session.user.image || undefined,
                  email_verified: user.email_verified !== false, // Default to true for Google
                },
                isNew
              );
            }),
          // Ensure Stripe customer exists
          ensureStripeCustomer(user.id, session.user.email || ""),
        ]).catch((error) => {
          // Log but don't fail session creation - user setup is non-critical
          logError("lib/auth (session callback - user setup)", error as Error, {
            userId: user.id,
          });
        });

        // Update last_login_at on every session (fire-and-forget)
        prisma.user
          .update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
          })
          .catch(() => {
            // Ignore errors - non-critical
          });

        // Log login audit event (fire-and-forget to not slow down auth)
        logAudit("user.login", user.id, {
          email: session.user.email,
          provider: user.provider,
        }).catch((error) => {
          // Silently fail - don't break auth if audit logging fails
          console.error("Failed to log audit event:", error);
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "database",
  },
});
