import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { runWorkflow } from "@/lib/pipedream/runWorkflow";
import { logUsage } from "@/lib/usage";
import { checkFeature } from "@/lib/feature-gate";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";

const workflowRunLimiter = createRateLimiter("workflow-run", 10, 60);

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  try {
    // Check rate limit
    await rateLimitOrThrow(request, workflowRunLimiter);

    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return NextResponse.json(
        {
          ok: false,
          error:
            authResult.status === 401
              ? "Unauthorized"
              : "Subscription required",
        },
        {
          status: authResult.status,
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      );
    }
    const { userId } = authResult;

    // Check if workflow execution is allowed for user's plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    if (!checkFeature(user, "allowWorkflowExecution")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Workflow execution is not available on your current plan. Please upgrade to Pro to execute workflows.",
        },
        { status: 403, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    const { id, inputData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Workflow ID is required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    // 1. Fetch workflow from Neon with user_id security scope
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { ok: false, error: "Workflow not found" },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    // 2. Get Pipedream workflow ID (stored in n8n_workflow_id field temporarily)
    const pipedreamWorkflowId = workflow.n8n_workflow_id;

    if (!pipedreamWorkflowId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Workflow is not activated. Please activate it first.",
        },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    // 3. Execute workflow in Pipedream using wrapper with proper error handling
    const runResult = await runWorkflow(pipedreamWorkflowId, inputData || {});

    if (!runResult.ok) {
      // Log failed execution attempt
      await prisma.execution.create({
        data: {
          workflow_id: id,
          user_id: userId,
          input_data: inputData || {},
          output_data: { error: runResult.error, details: runResult.details },
          status: "failure",
          finished_at: new Date(),
        },
      });

      logError(
        "app/api/workflows/run (execution failed)",
        new Error(runResult.error),
        {
          workflow_id: id,
          user_id: userId,
          details: runResult.details,
        },
      );

      return NextResponse.json(
        { ok: false, error: runResult.error, details: runResult.details },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    const execution = runResult.execution;

    // 4. Log successful execution to Neon database
    const executionRecord = await prisma.execution.create({
      data: {
        workflow_id: id,
        user_id: userId,
        input_data: inputData || {},
        output_data: execution.data?.output || null,
        status: "success",
        pipedream_execution_id: execution.id?.toString() || null,
        finished_at: execution.finished_at
          ? new Date(execution.finished_at)
          : null,
      },
    });

    // 5. Log usage
    await logUsage(userId, "workflow_run");

    // 5a. Log audit event
    await logAudit("workflow.run", userId, {
      workflow_id: id,
      workflow_name: workflow.name,
      execution_id: executionRecord.id,
      status: executionRecord.status,
    });

    // 5b. Emit event
    Events.emit("workflow:executed", {
      workflow_id: id,
      user_id: userId,
      execution_id: executionRecord.id,
      status: executionRecord.status,
    });

    return NextResponse.json(
      { ok: true, message: "Workflow executed", execution },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  } catch (err: unknown) {
    logError("app/api/workflows/run", err);

    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
}
