import { prisma } from "@/lib/prisma";

/**
 * Logs an audit event to the database.
 *
 * @param action - The action being performed (e.g., "workflow.create", "user.login")
 * @param userId - Optional user ID (null for system actions)
 * @param metadata - Optional metadata object to store additional context
 */
export async function logAudit(
  action: string,
  userId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    // Log audit errors but don't throw - audit logging should not break the main flow
    console.error("AUDIT LOG ERROR:", error);
  }
}
