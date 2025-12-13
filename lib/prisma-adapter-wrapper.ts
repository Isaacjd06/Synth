/**
 * Custom Prisma Adapter Wrapper
 * 
 * Maps NextAuth user fields to our Prisma schema:
 * - `image` → `avatar_url`
 * - `emailVerified` → `email_verified`
 */

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter, AdapterUser } from "next-auth/adapters";

// Create the base adapter with error handling
let baseAdapter: Adapter;
try {
  baseAdapter = PrismaAdapter(prisma) as Adapter;
  
  // Verify baseAdapter was created successfully
  if (!baseAdapter) {
    throw new Error("PrismaAdapter returned undefined");
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("[AUTH] Failed to create PrismaAdapter:", errorMessage);
  
  // Log available Prisma models for debugging
  try {
    const modelKeys = Object.keys(prisma).filter(
      key => !key.startsWith('$') && !key.startsWith('_') && typeof (prisma as any)[key] === 'object'
    );
    console.error("[AUTH] Available Prisma models:", modelKeys);
  } catch {
    // Ignore errors when checking models
  }
  
  throw new Error(
    `Failed to initialize PrismaAdapter: ${errorMessage}. ` +
    "Make sure Prisma Client has been generated and Session, Account, and VerificationToken models exist in your schema."
  );
}

// Custom adapter that maps fields
export const customPrismaAdapter: Adapter = {
  ...baseAdapter,
  
  async createUser(data) {
    // Map `image` to `avatar_url` and `emailVerified` to `email_verified`
    const { image, emailVerified, ...rest } = data;
    
    // Generate ID if not provided (NextAuth might not always provide one)
    let userId = rest.id;
    if (!userId) {
      const { randomUUID } = await import("crypto");
      userId = randomUUID();
    }
    
    // Create user directly with Prisma using correct field names
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: rest.name || null,
        email: rest.email,
        avatar_url: image || null,
        email_verified: emailVerified || false,
        created_at: new Date(),
      },
    });
    
    // Return in NextAuth format
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.email_verified ? new Date() : null,
      image: user.avatar_url,
    } as AdapterUser;
  },
  
  async updateUser(data) {
    // Map `image` to `avatar_url` and `emailVerified` to `email_verified`
    const { image, emailVerified, id, ...rest } = data;
    
    const updateData: any = { ...rest };
    if (image !== undefined) {
      updateData.avatar_url = image;
    }
    if (emailVerified !== undefined) {
      updateData.email_verified = emailVerified !== null;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.email_verified ? new Date() : null,
      image: user.avatar_url,
    } as AdapterUser;
  },
  
  async getUser(id) {
    // Query Prisma directly and map fields
    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) return null;
    
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: dbUser.email_verified ? new Date() : null,
      image: dbUser.avatar_url,
    } as AdapterUser;
  },
  
  async getUserByEmail(email) {
    // Query Prisma directly and map fields
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) return null;
    
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: dbUser.email_verified ? new Date() : null,
      image: dbUser.avatar_url,
    } as AdapterUser;
  },
  
  async getUserByAccount(providerAccount) {
    // Query Prisma directly and map fields
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerAccount.provider,
          providerAccountId: providerAccount.providerAccountId,
        },
      },
      include: { user: true },
    });
    
    if (!account?.user) return null;
    
    return {
      id: account.user.id,
      name: account.user.name,
      email: account.user.email,
      emailVerified: account.user.email_verified ? new Date() : null,
      image: account.user.avatar_url,
    } as AdapterUser;
  },
  // Bind adapter methods safely
  linkAccount: baseAdapter.linkAccount ? baseAdapter.linkAccount.bind(baseAdapter) : undefined,
  createSession: baseAdapter.createSession ? baseAdapter.createSession.bind(baseAdapter) : undefined,
  getSessionAndUser: baseAdapter.getSessionAndUser ? baseAdapter.getSessionAndUser.bind(baseAdapter) : undefined,
  updateSession: baseAdapter.updateSession ? baseAdapter.updateSession.bind(baseAdapter) : undefined,
  deleteSession: baseAdapter.deleteSession ? baseAdapter.deleteSession.bind(baseAdapter) : undefined,
  createVerificationToken: baseAdapter.createVerificationToken ? baseAdapter.createVerificationToken.bind(baseAdapter) : undefined,
  useVerificationToken: baseAdapter.useVerificationToken ? baseAdapter.useVerificationToken.bind(baseAdapter) : undefined,
  deleteUser: baseAdapter.deleteUser ? baseAdapter.deleteUser.bind(baseAdapter) : undefined,
  unlinkAccount: baseAdapter.unlinkAccount ? baseAdapter.unlinkAccount.bind(baseAdapter) : undefined,
};
