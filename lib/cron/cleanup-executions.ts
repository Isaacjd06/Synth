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
  } catch (error: any) {
    console.error("CLEANUP EXECUTIONS ERROR:", error);
    return {
      deleted: 0,
      error: error.message || "Unknown error",
    };
  }
}
