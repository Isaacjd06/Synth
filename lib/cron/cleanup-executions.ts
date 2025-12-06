import { prisma } from "@/lib/prisma";

/**
 * Deletes executions older than 30 days.
 *
 * @returns Object with count of deleted executions
 */
export async function cleanupExecutions(): Promise<{
  deleted: number;
  error?: string;
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.execution.deleteMany({
      where: {
        created_at: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return {
      deleted: result.count,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("CLEANUP EXECUTIONS ERROR:", err);
    return {
      deleted: 0,
      error: err.message || "Unknown error",
    };
  }
}
