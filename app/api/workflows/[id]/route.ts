import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { logError } from "@/lib/error-logger";
import type { WorkflowDetail } from "@/types/api";

/**
 * GET /api/workflows/[id]
 * 
 * Fetches a single workflow by ID for the authenticated user.
 * Returns workflow details including stats and timeline.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { id: workflowId } = await params;

    if (!workflowId) {
      return error("Workflow ID is required", { status: 400 });
    }

    // Fetch workflow by ID and verify ownership
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: workflowId,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        intent: true,
        trigger: true,
        actions: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!workflow) {
      return error("Workflow not found", { status: 404 });
    }

    // Get execution statistics
    const executions = await prisma.executions.findMany({
      where: { workflow_id: workflowId },
      select: {
        status: true,
        created_at: true,
        finished_at: true,
        started_at: true,
        execution_time_ms: true,
      },
    });

    // Calculate stats
    const totalRuns = executions.length;
    const successfulRuns = executions.filter(e => e.status === "success").length;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
    
    // Calculate average execution time
    const executionTimes = executions
      .map(e => e.execution_time_ms || (e.started_at && e.finished_at 
        ? new Date(e.finished_at).getTime() - new Date(e.started_at).getTime() 
        : null))
      .filter((t): t is number => t !== null);
    const avgTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    // Get last run
    const lastRun = executions.length > 0
      ? executions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at
      : null;

    // Build 7-day timeline
    const timeline: WorkflowDetail["timeline"] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayExecutions = executions.filter(e => {
        const execDate = new Date(e.created_at);
        return execDate >= date && execDate < nextDate;
      });

      timeline.push({
        date: date.toISOString().split("T")[0],
        runs: dayExecutions.length,
        successes: dayExecutions.filter(e => e.status === "success").length,
        failures: dayExecutions.filter(e => e.status === "error" || e.status === "failure").length,
      });
    }

    // Convert actions to steps format
    const steps = Array.isArray(workflow.actions)
      ? workflow.actions.map((action: unknown, index: number) => {
          const actionObj = action as Record<string, unknown>;
          return {
            id: `step-${index}`,
            name: (actionObj.name as string) || (actionObj.type as string) || `Step ${index + 1}`,
            description: (actionObj.description as string) || null,
            type: (actionObj.type as string) || "action",
            metadata: actionObj,
          };
        })
      : [];

    // Parse trigger
    const trigger = workflow.trigger
      ? {
          type: (workflow.trigger as Record<string, unknown>)?.type as string || "unknown",
          config: workflow.trigger,
        }
      : null;

    const workflowDetail: WorkflowDetail = {
      id: workflow.id,
      name: workflow.name,
      intent: workflow.intent,
      active: workflow.active,
      trigger,
      steps,
      stats: {
        totalRuns,
        avgTime: Math.round(avgTime),
        successRate: Math.round(successRate * 100) / 100,
        lastRunAt: lastRun ? new Date(lastRun).toISOString() : null,
      },
      timeline,
    };

    // Return workflow detail directly to match UI expectations
    return NextResponse.json(workflowDetail, { status: 200 });
  } catch (err) {
    logError("app/api/workflows/[id]", err);
    return error(
      "Failed to load workflow details. Please try again or contact support if the issue persists.",
      { status: 500 }
    );
  }
}

