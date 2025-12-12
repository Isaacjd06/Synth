/**
 * POST /api/executions/[id]/retry
 * 
 * Retries a failed execution by using the previous execution's input data
 * and running the workflow again.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have STARTER+ plan (FREE cannot run workflows)
 * - Execution must exist and belong to the user
 * - Workflow must still be active and have a Pipedream workflow ID
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
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";
import { logError } from "@/lib/error-logger";
import type { RetryExecutionResponse } from "@/types/api";

// Rate limit: 10 retries per minute
const executionRetryLimiter = createRateLimiter("execution-retry", 10, 60);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Check rate limit
    await rateLimitOrThrow(req, executionRetryLimiter);

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

    // 4. Get execution ID from params
    const { id: executionId } = await params;
    if (!executionId) {
      return error("Execution ID is required", { status: 400 });
    }

    // 5. Fetch the original execution and verify ownership
    const originalExecution = await prisma.executions.findFirst({
      where: {
        id: executionId,
        user_id: userId,
      },
      include: {
        workflows: {
          select: {
            id: true,
            name: true,
            pipedream_workflow_id: true,
            active: true,
            trigger: true,
            actions: true,
          },
        },
      },
    });

    if (!originalExecution) {
      return error("Execution not found", { status: 404 });
    }

    const workflow = originalExecution.workflows;
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

    // 8. Get input data from original execution
    const inputPayload = (originalExecution.input_data as Record<string, unknown>) || {};

    // 9. Get user subscription info for execution context
    const user = await getCurrentUserWithSubscription(userId);
    const effectivePlan = await getEffectiveSubscriptionPlan(userId);

    // 10. Start new execution log
    const newExecutionId = await startExecutionLog({
      workflowId: workflow.id,
      userId,
      input: inputPayload,
    });

    try {
      // 11. Run workflow using execution engine with original input
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
        executionId: newExecutionId,
        result,
      });

      // 13. Return success response
      const response: RetryExecutionResponse = {
        executionId: newExecutionId,
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
        execError instanceof Error ? execError.message : "Failed to retry execution";
      
      await updateExecutionWithError({
        executionId: newExecutionId,
        error: {
          message: errorMessage,
          stack: execError instanceof Error ? execError.stack || null : null,
          cause: null,
        },
      });

      return error(errorMessage, { status: 500, code: "EXECUTION_FAILED" });
    }
  } catch (err) {
    console.error("EXECUTION RETRY ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}
