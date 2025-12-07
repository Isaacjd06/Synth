import { prisma } from "@/lib/prisma";

/**
 * Deletes AuditLog entries older than 90 days.
 *
 * @returns Object with count of deleted audit logs
 */
export async function cleanupAuditLogs(): Promise<{
  deleted: number;
  error?: string;
}> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.auditLog.deleteMany({
      where: {
        created_at: {
          lt: ninetyDaysAgo,
        },
      },
    });

    return {
      deleted: result.count,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("CLEANUP AUDIT LOGS ERROR:", err);
    return {
      deleted: 0,
      error: err.message || "Unknown error",
    };
  }
}
