import { prisma } from "@/lib/prisma";

/**
 * Deletes UsageLog entries older than 60 days.
 *
 * @returns Object with count of deleted usage logs
 */
export async function cleanupUsageLogs(): Promise<{
  deleted: number;
  error?: string;
}> {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await prisma.usageLog.deleteMany({
      where: {
        created_at: {
          lt: sixtyDaysAgo,
        },
      },
    });

    return {
      deleted: result.count,
    };
  } catch (error: any) {
    console.error("CLEANUP USAGE LOGS ERROR:", error);
    return {
      deleted: 0,
      error: error.message || "Unknown error",
    };
  }
}
