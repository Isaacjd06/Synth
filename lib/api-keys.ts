"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/**
 * Generates a new API key for a user.
 * Creates a random key, hashes it with bcrypt, stores in DB, and returns the raw key.
 *
 * @param userId - The user ID
 * @param name - Optional friendly name for the key
 * @returns The raw API key (only shown once)
 */
export async function generateApiKey(userId: string, name?: string): Promise<string> {
  // Generate a random API key (32 bytes = 64 hex characters)
  const rawKey = `sk_${randomBytes(32).toString("hex")}`;

  // Extract prefix (first 11 characters: "sk_" + first 8 hex chars)
  const keyPrefix = rawKey.substring(0, 11);

  // Hash the key with bcrypt
  const keyHash = await bcrypt.hash(rawKey, 10);

  // Store the hashed key in the database
  await prisma.apiKey.create({
    data: {
      user_id: userId,
      name: name || `API Key ${new Date().toISOString().split('T')[0]}`,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: [],
      revoked: false,
    },
  });

  return rawKey;
}

/**
 * Verifies an API key and returns the associated user ID.
 *
 * @param rawKey - The raw API key to verify
 * @returns The user ID if the key is valid, null otherwise
 */
export async function verifyApiKey(rawKey: string): Promise<string | null> {
  // Extract the key prefix to validate format
  if (!rawKey.startsWith("sk_")) {
    return null;
  }

  // Extract prefix for faster lookup (first 11 chars)
  const keyPrefix = rawKey.substring(0, 11);

  // Get only API keys matching the prefix (much faster!)
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      key_prefix: keyPrefix,
      revoked: false,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ]
    },
    select: {
      id: true,
      user_id: true,
      key_hash: true,
    },
  });

  // Try to match the provided key against stored hashes with matching prefix
  for (const apiKey of apiKeys) {
    const isValid = await bcrypt.compare(rawKey, apiKey.key_hash);
    if (isValid) {
      // Update last_used_at timestamp (fire and forget)
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { last_used_at: new Date() }
      }).catch(() => {}); // Don't block on this

      return apiKey.user_id;
    }
  }

  return null;
}
