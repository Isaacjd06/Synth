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

// Create the base adapter
const baseAdapter = PrismaAdapter(prisma) as Adapter;

// Custom adapter that maps fields
export const customPrismaAdapter: Adapter = {
  ...baseAdapter,
  
  async createUser(data) {
    // Map `image` to `avatar_url` and `emailVerified` to `email_verified`
    const { image, emailVerified, ...rest } = data;
    
    // Create user directly with Prisma using correct field names
    const user = await prisma.user.create({
      data: {
        id: rest.id,
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
  linkAccount: baseAdapter.linkAccount?.bind(baseAdapter),
  createSession: baseAdapter.createSession?.bind(baseAdapter),
  getSessionAndUser: baseAdapter.getSessionAndUser?.bind(baseAdapter),
  updateSession: baseAdapter.updateSession?.bind(baseAdapter),
  deleteSession: baseAdapter.deleteSession?.bind(baseAdapter),
  createVerificationToken: baseAdapter.createVerificationToken?.bind(baseAdapter),
  useVerificationToken: baseAdapter.useVerificationToken?.bind(baseAdapter),
  deleteUser: baseAdapter.deleteUser?.bind(baseAdapter),
  unlinkAccount: baseAdapter.unlinkAccount?.bind(baseAdapter),
};
