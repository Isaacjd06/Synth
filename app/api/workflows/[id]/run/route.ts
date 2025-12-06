import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runWorkflow, PipedreamError } from "@/lib/pipedream";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * POST /api/workflows/[id]/run
 * 
 * Runs a workflow in Pipedream and creates an execution record.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be the admin user (SYSTEM_USER_ID)
 * - Workflow must exist and have a Pipedream workflow ID
 * 
 * Returns the execution result.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate admin user
    if (session.user.id !== SYSTEM_USER_ID) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id: workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { ok: false, error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // 3. Fetch workflow by ID
    const workflow = await prisma.workflows.findUnique({
      where: { id: workflowId },
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

    // 5. Call runWorkflow from Pipedream
    let pipedreamExecution;
    try {
      pipedreamExecution = await runWorkflow(workflow.n8n_workflow_id);
    } catch (error) {
      if (error instanceof PipedreamError) {
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to run workflow in Pipedream",
            pipedream_error: error.message,
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // 6. Create execution record in the executions table
    const execution = await prisma.execution.create({
      data: {
        workflow_id: workflow.id,
        user_id: session.user.id,
        input_data: pipedreamExecution.input_data || undefined,
        output_data: pipedreamExecution.output_data || undefined,
        status: pipedreamExecution.status || "unknown",
        pipedream_execution_id: pipedreamExecution.id,
        created_at: new Date(pipedreamExecution.started_at),
        finished_at: pipedreamExecution.finished_at
          ? new Date(pipedreamExecution.finished_at)
          : undefined,
      },
    });

    // 7. Return execution result
    return NextResponse.json(
      {
        ok: true,
        execution: {
          id: execution.id,
          workflow_id: execution.workflow_id,
          user_id: execution.user_id,
          input_data: execution.input_data,
          output_data: execution.output_data,
          status: execution.status,
          pipedream_execution_id: execution.pipedream_execution_id,
          created_at: execution.created_at,
          finished_at: execution.finished_at,
        },
        pipedream_execution: pipedreamExecution,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("WORKFLOW RUN ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

