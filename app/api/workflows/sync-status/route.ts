import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getWorkflow, PipedreamAPIError } from "@/lib/pipedreamClient";

/**
 * POST /api/workflows/sync-status
 * 
 * Syncs workflow status from Pipedream for all user's workflows
 * Updates database with real-time status from Pipedream
 */
export async function POST() {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // Get all workflows with Pipedream IDs
    const workflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        n8n_workflow_id: { not: null },
      },
      select: {
        id: true,
        n8n_workflow_id: true,
      },
    });

    const syncResults = [];

    for (const workflow of workflows) {
      if (!workflow.n8n_workflow_id) continue;

      try {
        // Fetch current status from Pipedream
        const pipedreamWorkflow = await getWorkflow(workflow.n8n_workflow_id);

        // Update database with Pipedream status
        await prisma.workflows.update({
          where: { id: workflow.id },
          data: {
            active: pipedreamWorkflow.active || false,
            pipedream_deployment_state: pipedreamWorkflow.active ? "active" : "inactive",
          },
        });

        syncResults.push({
          workflow_id: workflow.id,
          pipedream_workflow_id: workflow.n8n_workflow_id,
          status: pipedreamWorkflow.active ? "active" : "inactive",
          synced: true,
        });
      } catch (error) {
        if (error instanceof PipedreamAPIError) {
          syncResults.push({
            workflow_id: workflow.id,
            pipedream_workflow_id: workflow.n8n_workflow_id,
            status: "error",
            error: error.message,
            synced: false,
          });
        } else {
          syncResults.push({
            workflow_id: workflow.id,
            pipedream_workflow_id: workflow.n8n_workflow_id,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            synced: false,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      synced: syncResults.filter((r) => r.synced).length,
      failed: syncResults.filter((r) => !r.synced).length,
      results: syncResults,
    });
  } catch (error: unknown) {
    console.error("SYNC STATUS ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

