import { NextResponse } from "next/server";
import { authenticateWithAccessInfo } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/updates
 * 
 * Returns Synth Updates - factual, data-driven updates about the user's automation/workflows.
 * For unpaid users, returns empty updates.
 */
export async function GET() {
  try {
    const authResult = await authenticateWithAccessInfo();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }

    const { userId, accessInfo } = authResult;

    // If user doesn't have full access, return empty updates
    if (!accessInfo.hasFullAccess) {
      return NextResponse.json({
        ok: true,
        updates: [],
        stats: {
          activeWorkflows: 0,
          totalExecutions: 0,
          executionsLast24h: 0,
          successRate: 0,
        },
      });
    }

    // Calculate statistics
    const activeWorkflowsCount = await prisma.workflows.count({
      where: {
        user_id: userId,
        active: true,
      },
    });

    const totalExecutions = await prisma.execution.count({
      where: {
        user_id: userId,
      },
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const executionsLast24h = await prisma.execution.count({
      where: {
        user_id: userId,
        created_at: {
          gte: yesterday,
        },
      },
    });

    // Calculate success rate
    const successExecutions = await prisma.execution.count({
      where: {
        user_id: userId,
        status: "success",
      },
    });

    const successRate =
      totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0;

    // Get recent notable events
    const updates: Array<Record<string, unknown>> = [];

    // Check for workflows that never ran
    const workflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        active: true,
      },
      include: {
        executions: {
          take: 1,
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    const neverRunWorkflows = workflows.filter((w) => w.executions.length === 0);
    if (neverRunWorkflows.length > 0) {
      updates.push({
        type: "workflow_never_run",
        title: `${neverRunWorkflows.length} workflow${neverRunWorkflows.length > 1 ? "s have" : " has"} never run`,
        message: `You have ${neverRunWorkflows.length} active workflow${neverRunWorkflows.length > 1 ? "s" : ""} that haven't executed yet.`,
        priority: "medium",
        createdAt: new Date(),
      });
    }

    // Check for recent failures
    const recentFailures = await prisma.execution.count({
      where: {
        user_id: userId,
        status: "failure",
        created_at: {
          gte: yesterday,
        },
      },
    });

    if (recentFailures > 0) {
      updates.push({
        type: "recent_failures",
        title: `${recentFailures} workflow execution${recentFailures > 1 ? "s failed" : " failed"} in the last 24 hours`,
        message: `You have ${recentFailures} failed execution${recentFailures > 1 ? "s" : ""} that may need attention.`,
        priority: "high",
        createdAt: new Date(),
      });
    }

    // Check for workflows with low success rate
    const workflowsWithStats = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        active: true,
      },
      include: {
        executions: {
          select: {
            status: true,
          },
        },
      },
    });

    workflowsWithStats.forEach((workflow) => {
      const executions = workflow.executions;
      if (executions.length >= 5) {
        // Only check workflows with at least 5 executions
        const failures = executions.filter((e) => e.status === "failure").length;
        const failureRate = (failures / executions.length) * 100;
        if (failureRate > 50) {
          updates.push({
            type: "low_success_rate",
            title: `Workflow "${workflow.name}" has a ${failureRate.toFixed(0)}% failure rate`,
            message: `This workflow may need attention - ${failures} out of ${executions.length} executions failed.`,
            priority: "high",
            workflowId: workflow.id,
            workflowName: workflow.name,
            createdAt: new Date(),
          });
        }
      }
    });

    // Sort updates by priority (high first) and date (newest first)
    updates.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return NextResponse.json({
      ok: true,
      updates: updates.slice(0, 10), // Limit to 10 most important updates
      stats: {
        activeWorkflows: activeWorkflowsCount,
        totalExecutions,
        executionsLast24h,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
      },
    });
  } catch (error: unknown) {
    console.error("DASHBOARD UPDATES ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

