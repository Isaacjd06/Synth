/**
 * POST /api/workflows/[id]/run
 *
 * Runs a workflow using the execution engine and creates an execution record.
 *
 * Requirements:
 * - User must be authenticated
 * - User must have STARTER+ plan (FREE cannot run workflows)
 * - Workflow must exist and have a Pipedream workflow ID
 * - Workflow must be active
 *
 * Returns the execution result.
 */

import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { requireSubscriptionLevel } from "@/lib/subscription";
import { checkWorkflowRunLimit } from "@/lib/workflow-limits";
import { getEffectiveSubscriptionPlan, getCurrentUserWithSubscription } from "@/lib/subscription";
import { runWorkflow as executeWorkflow } from "@/lib/execution-engine";
import { startExecutionLog, completeExecutionLog, updateExecutionWithError } from "@/lib/execution-logger";
import { logError } from "@/lib/error-logger";
import type { RunWorkflowResponse } from "@/types/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    // 2. Check subscription level - FREE cannot run workflows
    const planCheck = await requireSubscriptionLevel(userId, "starter");
    if (planCheck) {
      return planCheck; // Returns 403 with error message
    }

    // 3. Check workflow run limit
    const limitError = await checkWorkflowRunLimit(userId);
    if (limitError) {
      return error(limitError, { status: 403, code: "LIMIT_EXCEEDED" });
    }

    // 4. Get workflow ID from params
    const { id: workflowId } = await params;
    if (!workflowId) {
      return error("Workflow ID is required", { status: 400 });
    }

    // 5. Fetch workflow by ID and verify ownership
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: workflowId,
        user_id: userId,
      },
    });

    if (!workflow) {
      return error("Workflow not found", { status: 404 });
    }

    // 6. Check if workflow has a Pipedream workflow ID
    if (!workflow.pipedream_workflow_id) {
      return error(
        "Workflow is not activated. Please activate the workflow first.",
        { status: 400, code: "WORKFLOW_NOT_ACTIVATED" }
      );
    }

    // 7. Check if workflow is active
    if (!workflow.active) {
      return error(
        "Workflow is not active. Please activate the workflow first.",
        { status: 400, code: "WORKFLOW_INACTIVE" }
      );
    }

    // 8. Parse input payload from request body
    let inputPayload: Record<string, unknown> = {};
    try {
      const body = await req.json();
      inputPayload = body.payload || body.input_data || body || {};
    } catch {
      // If no body or invalid JSON, use empty payload
      inputPayload = {};
    }

    // 9. Get user subscription info for execution context
    const user = await getCurrentUserWithSubscription(userId);
    const effectivePlan = await getEffectiveSubscriptionPlan(userId);

    // 10. Start execution log
    const executionId = await startExecutionLog({
      workflowId: workflow.id,
      userId,
      input: inputPayload,
    });

    try {
      // 11. Run workflow using execution engine
      const result = await executeWorkflow({
        workflow: {
          id: workflow.id,
          name: workflow.name,
          pipedream_workflow_id: workflow.pipedream_workflow_id,
          active: workflow.active,
          trigger: workflow.trigger,
          actions: workflow.actions,
        },
        input: { payload: inputPayload },
        user: {
          id: user.id,
          subscription_plan: effectivePlan,
        },
      });

      // 12. Complete execution log
      await completeExecutionLog({
        executionId,
        result,
      });

      // 13. Return success response
      const response: RunWorkflowResponse = {
        executionId,
        status: result.status,
        durationMs: result.durationMs,
        startedAt: result.startedAt.toISOString(),
        finishedAt: result.finishedAt?.toISOString() || null,
        outputPreview: result.output
          ? (Object.keys(result.output).length > 0
              ? { keys: Object.keys(result.output).slice(0, 5) }
              : null)
          : null,
      };

      return success(response);
    } catch (execError) {
      // Handle execution errors
      const errorMessage =
        execError instanceof Error ? execError.message : "Failed to execute workflow";
      
      await updateExecutionWithError({
        executionId,
        error: {
          message: errorMessage,
          stack: execError instanceof Error ? execError.stack || null : null,
          cause: null,
        },
      });

      return error(errorMessage, { status: 500, code: "EXECUTION_FAILED" });
    }
  } catch (err) {
    logError("app/api/workflows/[id]/run", err);
    return error(
      "Failed to run workflow. Please try again or contact support if the issue persists.",
      { status: 500, code: "EXECUTION_FAILED" }
    );
  }
}
