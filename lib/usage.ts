"use server";

import { prisma } from "@/lib/prisma";

/**
 * Logs a usage event for a user.
 *
 * @param userId - The user ID
 * @param event - The event name (e.g., "workflow_run", "chat_message", "memory_write")
 * @param amount - The amount to log (default: 1)
 */
export async function logUsage(
  userId: string,
  event: string,
  amount: number = 1,
): Promise<void> {
  await prisma.usageLog.create({
    data: {
      user_id: userId,
      event,
      amount,
    },
  });
}

/**
 * Gets a summary of usage events for a user.
 * Returns an object with event names as keys and total amounts as values.
 *
 * @param userId - The user ID
 * @returns A summary object with event names and their total counts
 */
export async function getUsageSummary(
  userId: string,
): Promise<{ [event: string]: number }> {
  const logs = await prisma.usageLog.groupBy({
    by: ["event"],
    where: {
      user_id: userId,
    },
    _sum: {
      amount: true,
    },
  });

  const summary: { [event: string]: number } = {};
  for (const log of logs) {
    summary[log.event] = log._sum.amount || 0;
  }

  return summary;
}
