/**
 * Memory Service
 * 
 * Provides a unified interface for accessing user memory and chat history
 * for context-aware AI interactions.
 */

import { prisma } from "@/lib/prisma";
import { getRelevantMemories, storeMemory as storeMemoryUtil } from "@/lib/memory";
import type { Prisma } from "@prisma/client";

/**
 * User memory item
 */
export interface UserMemory {
  key: string;
  value: string;
  createdAt: Date;
  contextType?: string;
}

/**
 * Chat message for context
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

/**
 * Get user memories
 * Fetches relevant rows from the memory table for a user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of memories to return (default: 10)
 * @returns Array of user memories
 */
export async function getUserMemory(
  userId: string,
  limit: number = 10
): Promise<UserMemory[]> {
  const memories = await getRelevantMemories(userId, undefined, limit);
  
  return memories.map((memory) => {
    const content = memory.content;
    const contentStr = typeof content === "string" 
      ? content 
      : JSON.stringify(content);
    
    return {
      key: memory.context_type,
      value: contentStr,
      createdAt: new Date(), // Will be set from memory if available
      contextType: memory.context_type,
    };
  });
}

/**
 * Append user memory
 * Inserts a new row into the memory table
 * 
 * @param userId - User ID
 * @param key - Memory key/context type
 * @param value - Memory value/content
 */
export async function appendUserMemory(
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await storeMemoryUtil(
    userId,
    key,
    value as Prisma.InputJsonValue,
    null,
    {
      created_from: "memory_service",
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Get recent chat messages
 * Fetches last N chat messages for a user, ordered by created_at
 * 
 * @param userId - User ID
 * @param limit - Maximum number of messages to return (default: 10)
 * @returns Array of chat messages
 */
export async function getRecentChatMessages(
  userId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: "desc",
    },
    take: limit,
    select: {
      role: true,
      content: true,
      created_at: true,
    },
  });

  // Reverse to get chronological order (oldest first)
  return messages.reverse().map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
    createdAt: msg.created_at,
  }));
}

/**
 * Summarize long history
 * TODO: Implement long-history summarization for very long conversation histories
 * This would use an LLM to condense old messages into a summary
 * 
 * @param messages - Array of chat messages
 * @returns Summary string
 */
export async function summarizeLongHistory(
  messages: ChatMessage[]
): Promise<string> {
  // TODO: Implement LLM-based summarization
  // For now, return a placeholder
  if (messages.length > 20) {
    return `Previous conversation had ${messages.length} messages. Key topics discussed.`;
  }
  return "";
}

