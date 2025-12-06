import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { listExecutions, PipedreamError } from "@/lib/pipedream";

/**
 * GET /api/workflows/[id]/executions
 * 
 * Fetches execution logs for a workflow from Pipedream.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have valid subscription
 * - Workflow must exist and have a Pipedream workflow ID
 * 
 * Returns execution logs as JSON.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user and check subscription
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id: workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { ok: false, error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // 3. Fetch workflow by ID and verify ownership
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: workflowId,
        user_id: userId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { ok: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    // 4. Check if workflow has a Pipedream ID
    if (!workflow.n8n_workflow_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Workflow does not have a Pipedream workflow ID. Please create the workflow in Pipedream first.",
        },
        { status: 400 }
      );
    }

    // 5. Call listExecutions from Pipedream
    let executions;
    try {
      executions = await listExecutions(workflow.n8n_workflow_id);
    } catch (error) {
      if (error instanceof PipedreamError) {
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to fetch executions from Pipedream",
            pipedream_error: error.message,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // 6. Return execution logs as JSON
    return NextResponse.json(
      {
        ok: true,
        workflow_id: workflow.id,
        pipedream_workflow_id: workflow.n8n_workflow_id,
        executions: executions.map((exec) => ({
          id: exec.id,
          workflow_id: exec.workflow_id,
          status: exec.status,
          started_at: exec.started_at,
          finished_at: exec.finished_at,
          input_data: exec.input_data,
          output_data: exec.output_data,
          error: exec.error,
        })),
        count: executions.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("WORKFLOW EXECUTIONS ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

