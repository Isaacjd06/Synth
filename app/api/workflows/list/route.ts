import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import type { WorkflowListItem } from "@/types/api";

/**
 * GET /api/workflows/list
 * 
 * List all workflows for the authenticated user.
 * Unpaid users can view workflows but not modify them.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const workflows = await prisma.workflows.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Get execution counts and last run for each workflow
    const workflowsWithStats: WorkflowListItem[] = await Promise.all(
      workflows.map(async (workflow) => {
        // Get last execution
        const lastExecution = await prisma.executions.findFirst({
          where: { workflow_id: workflow.id },
          orderBy: { created_at: "desc" },
          select: { created_at: true },
        });

        // Count total executions
        const runCount = await prisma.executions.count({
          where: { workflow_id: workflow.id },
        });

        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          active: workflow.active,
          lastRun: lastExecution?.created_at.toISOString() || null,
          runCount,
          readOnly: !authResult.hasValidSubscription,
        };
      })
    );

    // Return array directly to match UI expectations (existing route format)
    return NextResponse.json(workflowsWithStats, { status: 200 });
  } catch (err) {
    console.error("WORKFLOW LIST ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}
