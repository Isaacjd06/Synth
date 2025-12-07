/**
 * Memory System Utilities for Synth
 * 
 * Provides functions for retrieving, storing, and managing user memory
 * for contextual chat responses and workflow generation.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Retrieve relevant memories for a given context
 * 
 * @param userId - User ID
 * @param contextType - Type of context to search for (optional, searches all if not provided)
 * @param limit - Maximum number of memories to return
 * @returns Array of relevant memories
 */
export async function getRelevantMemories(
  userId: string,
  contextType?: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  context_type: string;
  content: Prisma.JsonValue;
  relevance_score: number | null;
  metadata: Prisma.JsonValue | null;
}>> {
  const where: Prisma.MemoryWhereInput = {
    user_id: userId,
  };

  if (contextType) {
    where.context_type = contextType;
  }

  const memories = await prisma.memory.findMany({
    where,
    orderBy: [
      { relevance_score: "desc" },
      { last_accessed: "desc" },
      { created_at: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      context_type: true,
      content: true,
      relevance_score: true,
      metadata: true,
    },
  });

  return memories;
}

/**
 * Search memories by content/keywords
 * 
 * @param userId - User ID
 * @param searchTerm - Term to search for in memory content
 * @param limit - Maximum number of memories to return
 * @returns Array of matching memories
 */
export async function searchMemories(
  userId: string,
  searchTerm: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  context_type: string;
  content: Prisma.JsonValue;
  relevance_score: number | null;
  metadata: Prisma.JsonValue | null;
}>> {
  // Simple text search - in production, you might want to use full-text search or vector embeddings
  // For now, we'll do a basic search by converting JSON content to string
  const allMemories = await prisma.memory.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      context_type: true,
      content: true,
      relevance_score: true,
      metadata: true,
    },
  });

  // Filter memories that contain the search term (case-insensitive)
  const searchLower = searchTerm.toLowerCase();
  const matchingMemories = allMemories.filter((memory) => {
    const contentStr =
      typeof memory.content === "string"
        ? memory.content
        : JSON.stringify(memory.content);
    const metadataStr = memory.metadata
      ? JSON.stringify(memory.metadata)
      : "";
    return (
      contentStr.toLowerCase().includes(searchLower) ||
      metadataStr.toLowerCase().includes(searchLower) ||
      memory.context_type.toLowerCase().includes(searchLower)
    );
  });

  // Sort and limit
  matchingMemories.sort((a, b) => {
    if (a.relevance_score !== null && b.relevance_score !== null) {
      return b.relevance_score - a.relevance_score;
    }
    if (a.relevance_score !== null) return -1;
    if (b.relevance_score !== null) return 1;
    return 0;
  });

  return matchingMemories.slice(0, limit);
}

/**
 * Store memory from chat interaction
 * 
 * @param userId - User ID
 * @param contextType - Type of memory context
 * @param content - Memory content (can be JSON or string)
 * @param relevanceScore - Optional relevance score
 * @param metadata - Optional metadata
 */
export async function storeMemory(
  userId: string,
  contextType: string,
  content: Prisma.JsonValue,
  relevanceScore?: number | null,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  await prisma.memory.create({
    data: {
      user_id: userId,
      context_type: contextType,
      content: content as Prisma.InputJsonValue,
      relevance_score: relevanceScore ?? null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      last_accessed: new Date(),
    },
  });
}

/**
 * Update memory last_accessed timestamp
 * 
 * @param memoryId - Memory ID
 */
export async function updateMemoryAccess(memoryId: string): Promise<void> {
  await prisma.memory.update({
    where: { id: memoryId },
    data: { last_accessed: new Date() },
  });
}

/**
 * Format memories for AI context
 * Converts memory objects into a string format suitable for inclusion in AI prompts
 * 
 * @param memories - Array of memory objects
 * @returns Formatted string for AI context
 */
export function formatMemoriesForContext(
  memories: Array<{
    context_type: string;
    content: Prisma.JsonValue;
    metadata: Prisma.JsonValue | null;
  }>
): string {
  if (memories.length === 0) {
    return "";
  }

  const formatted = memories.map((memory, index) => {
    const contentStr =
      typeof memory.content === "string"
        ? memory.content
        : JSON.stringify(memory.content);

    const metadataStr = memory.metadata
      ? `\n  Metadata: ${JSON.stringify(memory.metadata)}`
      : "";

    return `[Memory ${index + 1} - ${memory.context_type}]\n  ${contentStr}${metadataStr}`;
  });

  return `\n\nRelevant context from previous conversations:\n${formatted.join("\n\n")}`;
}

