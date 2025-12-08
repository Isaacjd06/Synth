import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

// Validate AUTH_SECRET is set
if (!process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET is required. Please set it in your .env.local file.\n" +
    "Generate one with: openssl rand -base64 32"
  );
}

// Minimal auth config for testing
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.AUTH_SECRET,
  basePath: "/api/auth",
  trustHost: true,
  debug: true, // Always show debug logs
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH SIMPLE] signIn callback:", { email: user?.email, provider: account?.provider });
      return true; // Always allow - adapter handles user creation
    },
    async session({ session, user }) {
      console.log("[AUTH SIMPLE] session callback:", { userId: user?.id });
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
});
