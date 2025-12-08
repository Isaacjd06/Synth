import { NextResponse } from "next/server";
import { authenticateWithAccessInfo } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getWorkflow, PipedreamAPIError } from "@/lib/pipedreamClient";

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
      // Ensure auth errors also return proper JSON structure
      // Check if it's already JSON, if not, wrap it
      const contentType = authResult.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return authResult; // Already JSON, return as-is
      }
      // If somehow not JSON, return proper JSON structure
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          stats: {
            activeWorkflows: 0,
            totalExecutions: 0,
            executionsLast24h: 0,
            successRate: 0,
          },
          updates: [],
          recentWorkflows: [],
          recentExecutions: [],
        },
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
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
        recentWorkflows: [],
        recentExecutions: [],
        systemStatus: "unknown",
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // First, sync workflow status from Pipedream for accurate counts
    const workflowsWithPipedreamIds = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        n8n_workflow_id: { not: null },
      },
      select: {
        id: true,
        n8n_workflow_id: true,
      },
    });

    // Sync status from Pipedream (in background, don't block on errors)
    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const pipedreamWorkflow = await getWorkflow(workflow.n8n_workflow_id);
        await prisma.workflows.update({
          where: { id: workflow.id },
          data: {
            active: pipedreamWorkflow.active || false,
            pipedream_deployment_state: pipedreamWorkflow.active ? "active" : "inactive",
          },
        });
      } catch (error) {
        // Log but don't fail - continue with database values
        console.warn(`Failed to sync workflow ${workflow.id} from Pipedream:`, error);
      }
    }

    // Calculate statistics from synced data
    // Wrap database operations in try-catch to handle connection errors
    const activeWorkflowsCount = await prisma.workflows.count({
      where: {
        user_id: userId,
        active: true,
      },
    });

    // Aggregate execution counts from Pipedream for all workflows
    let totalExecutions = 0;
    let executionsLast24h = 0;
    let successExecutions = 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get execution counts from Pipedream for each workflow
    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const { listExecutions } = await import("@/lib/pipedream");
        const executions = await listExecutions(workflow.n8n_workflow_id);
        
        totalExecutions += executions.length;
        
        // Count executions from last 24h and successes
        for (const exec of executions) {
          const execDate = new Date(exec.started_at);
          if (execDate >= yesterday) {
            executionsLast24h++;
          }
          if (exec.status === "success") {
            successExecutions++;
          }
        }
      } catch (error) {
        // Log but continue - use database counts as fallback
        console.warn(`Failed to get executions from Pipedream for workflow ${workflow.id}:`, error);
      }
    }

    // Fallback to database counts if no Pipedream data available
    if (totalExecutions === 0 && workflowsWithPipedreamIds.length === 0) {
      totalExecutions = await prisma.executions.count({
        where: { user_id: userId },
      });
      
      executionsLast24h = await prisma.executions.count({
        where: {
          user_id: userId,
          created_at: { gte: yesterday },
        },
      });
      
      successExecutions = await prisma.executions.count({
        where: {
          user_id: userId,
          status: "success",
        },
      });
    }

    const successRate =
      totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0;

    // Get recent notable events
    const updates: Array<Record<string, unknown>> = [];

    // Check for workflows that never ran (using Pipedream data)
    const neverRunWorkflows: Array<{ id: string; name: string }> = [];
    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const { listExecutions } = await import("@/lib/pipedream");
        const executions = await listExecutions(workflow.n8n_workflow_id);
        
        if (executions.length === 0) {
          const dbWorkflow = await prisma.workflows.findUnique({
            where: { id: workflow.id },
            select: { name: true },
          });
          
          neverRunWorkflows.push({
            id: workflow.id,
            name: dbWorkflow?.name || "Unknown",
          });
        }
      } catch (error) {
        // Continue with next workflow
      }
    }
    
    if (neverRunWorkflows.length > 0) {
      updates.push({
        type: "workflow_never_run",
        title: `${neverRunWorkflows.length} workflow${neverRunWorkflows.length > 1 ? "s have" : " has"} never run`,
        message: `You have ${neverRunWorkflows.length} active workflow${neverRunWorkflows.length > 1 ? "s" : ""} that haven't executed yet.`,
        priority: "medium",
        createdAt: new Date(),
      });
    }

    // Check for recent failures from Pipedream
    let recentFailures = 0;
    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const { listExecutions } = await import("@/lib/pipedream");
        const executions = await listExecutions(workflow.n8n_workflow_id);
        
        for (const exec of executions) {
          const execDate = new Date(exec.started_at);
          if (execDate >= yesterday && (exec.status === "failure" || exec.status === "error")) {
            recentFailures++;
          }
        }
      } catch (error) {
        // Continue with next workflow
      }
    }
    
    // Fallback to database if no Pipedream data
    if (recentFailures === 0 && workflowsWithPipedreamIds.length === 0) {
      recentFailures = await prisma.executions.count({
        where: {
          user_id: userId,
          status: "failure",
          created_at: { gte: yesterday },
        },
      });
    }

    if (recentFailures > 0) {
      updates.push({
        type: "recent_failures",
        title: `${recentFailures} workflow execution${recentFailures > 1 ? "s failed" : " failed"} in the last 24 hours`,
        message: `You have ${recentFailures} failed execution${recentFailures > 1 ? "s" : ""} that may need attention.`,
        priority: "high",
        createdAt: new Date(),
      });
    }

    // Check for workflows with low success rate (using Pipedream data)
    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const { listExecutions } = await import("@/lib/pipedream");
        const executions = await listExecutions(workflow.n8n_workflow_id);
        
        if (executions.length >= 5) {
          // Only check workflows with at least 5 executions
          const failures = executions.filter(
            (e) => e.status === "failure" || e.status === "error"
          ).length;
          const failureRate = (failures / executions.length) * 100;
          
          if (failureRate > 50) {
            const dbWorkflow = await prisma.workflows.findUnique({
              where: { id: workflow.id },
              select: { name: true },
            });
            
            updates.push({
              type: "low_success_rate",
              title: `Workflow "${dbWorkflow?.name || "Unknown"}" has a ${failureRate.toFixed(0)}% failure rate`,
              message: `This workflow may need attention - ${failures} out of ${executions.length} executions failed.`,
              priority: "high",
              workflowId: workflow.id,
              workflowName: dbWorkflow?.name || "Unknown",
              createdAt: new Date(),
            });
          }
        }
      } catch (error) {
        // Continue with next workflow
      }
    }

    // Sort updates by priority (high first) and date (newest first)
    updates.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      );
    });

    // Get recent workflows (last 3)
    const recentWorkflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 3,
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        created_at: true,
      },
    });

    // Get recent executions from Pipedream (aggregate from all workflows)
    const allRecentExecutions: Array<{
      id: string;
      workflow_id: string;
      status: string;
      created_at: Date;
      workflow: { id: string; name: string };
    }> = [];

    for (const workflow of workflowsWithPipedreamIds) {
      if (!workflow.n8n_workflow_id) continue;
      
      try {
        const { listExecutions } = await import("@/lib/pipedream");
        const executions = await listExecutions(workflow.n8n_workflow_id);
        
        // Get workflow name from database
        const dbWorkflow = await prisma.workflows.findUnique({
          where: { id: workflow.id },
          select: { name: true },
        });
        
        for (const exec of executions.slice(0, 10)) { // Get last 10 from each workflow
          allRecentExecutions.push({
            id: exec.id,
            workflow_id: workflow.id,
            status: exec.status,
            created_at: new Date(exec.started_at),
            workflow: {
              id: workflow.id,
              name: dbWorkflow?.name || "Unknown Workflow",
            },
          });
        }
      } catch (error) {
        // Continue with next workflow
      }
    }

    // Sort by date and take most recent 3
    allRecentExecutions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    const recentExecutions = allRecentExecutions.slice(0, 3);

    // Fallback to database if no Pipedream executions
    if (recentExecutions.length === 0) {
      const dbExecutions = await prisma.executions.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: 3,
        select: {
          id: true,
          workflow_id: true,
          status: true,
          created_at: true,
          workflow: {
            select: { id: true, name: true },
          },
        },
      });
      recentExecutions.push(...dbExecutions);
    }

    // Determine system status based on Pipedream connectivity
    let systemStatus = "operational";
    try {
      // Quick check: if we have workflows with Pipedream IDs, try to verify connectivity
      if (workflowsWithPipedreamIds.length > 0 && workflowsWithPipedreamIds[0].n8n_workflow_id) {
        await getWorkflow(workflowsWithPipedreamIds[0].n8n_workflow_id);
        systemStatus = "operational";
      }
    } catch (error) {
      // If we can't reach Pipedream, mark as degraded
      if (error instanceof PipedreamAPIError) {
        systemStatus = "degraded";
      }
    }

    return NextResponse.json({
      ok: true,
      updates: updates.slice(0, 10), // Limit to 10 most important updates
      stats: {
        activeWorkflows: activeWorkflowsCount,
        totalExecutions,
        executionsLast24h,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
      },
      recentWorkflows,
      recentExecutions,
      systemStatus,
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    console.error("DASHBOARD UPDATES ERROR:", error);
    // Always return JSON, even on unexpected errors
    // This prevents Next.js from returning HTML error pages
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
        stats: {
          activeWorkflows: 0,
          totalExecutions: 0,
          executionsLast24h: 0,
          successRate: 0,
        },
        updates: [],
        recentWorkflows: [],
        recentExecutions: [],
        systemStatus: "error",
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

