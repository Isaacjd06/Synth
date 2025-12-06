import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import { logAudit } from "@/lib/audit";
import { stripe } from "@/lib/stripe";
import { logError } from "@/lib/error-logger";

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
      // Auto-create Stripe customer on first login if not exists
      if (user?.email) {
        try {
          // Query user from database to check stripe_customer_id
          // Use user.id if available (from adapter), otherwise query by email
          const dbUser = user?.id
            ? await prisma.user.findUnique({
                where: { id: user.id },
                select: { id: true, email: true, stripeCustomerId: true },
              })
            : await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true, email: true, stripeCustomerId: true },
              });

          // Create Stripe customer if user exists but doesn't have one
          if (dbUser && !dbUser.stripeCustomerId && dbUser.email) {
            const customer = await stripe.customers.create({
              email: dbUser.email,
              metadata: { userId: dbUser.id },
            });

            // Update user with Stripe customer ID
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { stripeCustomerId: customer.id },
            });
          }
        } catch (error: any) {
          // Log error but don't block login flow
          logError("lib/auth (signIn - Stripe customer creation)", error, {
            email: user.email,
            userId: user?.id,
          });
          // Continue with sign-in even if Stripe customer creation fails
        }
      }

      // Always allow sign-in
      return true;
    },
    async session({ session, user }) {
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
