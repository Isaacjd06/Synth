import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { runWorkflow, PipedreamError } from "@/lib/pipedream";
import { logUsage } from "@/lib/usage";
import { checkFeature } from "@/lib/feature-gate";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";

/**
 * POST /api/workflows/[id]/run
 *
 * Runs a workflow in Pipedream and creates an execution record.
 *
 * Requirements:
 * - User must be authenticated
 * - Workflow must exist and have a Pipedream workflow ID
 *
 * Returns the execution result.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate user and check subscription
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    // 1a. Check if workflow execution is allowed for user's plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!checkFeature(user, "allowWorkflowExecution")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Workflow execution is not available on your current plan. Please upgrade to Pro to execute workflows.",
        },
        { status: 403 },
      );
    }

    const { id: workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { ok: false, error: "Workflow ID is required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // 4. Check if workflow has a Pipedream ID
    if (!workflow.n8n_workflow_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Workflow does not have a Pipedream workflow ID. Please create the workflow in Pipedream first.",
        },
        { status: 400 },
      );
    }

    // 5. Call runWorkflow from Pipedream
    let pipedreamExecution;
    try {
      pipedreamExecution = await runWorkflow(workflow.n8n_workflow_id);
    } catch (error) {
      if (error instanceof PipedreamError) {
        logError("app/api/workflows/[id]/run (Pipedream)", error, {
          workflow_id: workflow.id,
          pipedream_workflow_id: workflow.n8n_workflow_id,
        });
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to run workflow in Pipedream",
            pipedream_error: error.message,
          },
          { status: 500 },
        );
      }
      throw error;
    }

    // 6. Create execution record in the executions table
    const execution = await prisma.execution.create({
      data: {
        workflow_id: workflow.id,
        user_id: userId,
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

    // 7. Log usage
    await logUsage(userId, "workflow_run");

    // 7a. Log audit event
    await logAudit("workflow.run", userId, {
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      execution_id: execution.id,
      status: execution.status,
    });

    // 7b. Emit event
    Events.emit("workflow:executed", {
      workflow_id: workflow.id,
      user_id: userId,
      execution_id: execution.id,
      status: execution.status,
    });

    // 8. Return execution result
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
      { status: 201 },
    );
  } catch (error: any) {
    logError("app/api/workflows/[id]/run", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
