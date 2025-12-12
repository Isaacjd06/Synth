import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { logError } from "@/lib/error-logger";
import type { ExecutionDetail } from "@/types/api";

/**
 * GET /api/executions/[id]
 * 
 * Returns detailed information about a specific execution.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { id } = await params;

    // Fetch execution and verify ownership
    const execution = await prisma.executions.findFirst({
      where: {
        id,
        user_id: userId,
      },
      select: {
        id: true,
        status: true,
        created_at: true,
        started_at: true,
        finished_at: true,
        execution_time_ms: true,
        input_data: true,
        output_data: true,
        error_message: true,
        workflows: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!execution) {
      return error("Execution not found", { status: 404 });
    }

    // Parse execution data to extract step information
    // Steps are typically stored in output_data or can be reconstructed from execution metadata
    const steps: ExecutionDetail["steps"] = [];
    
    // If output_data contains step information, extract it
    if (execution.output_data && typeof execution.output_data === "object") {
      const outputData = execution.output_data as Record<string, unknown>;
      if (Array.isArray(outputData.steps)) {
        steps.push(...(outputData.steps as ExecutionDetail["steps"]));
      }
    }

    // If no steps in output, create a single step from execution data
    if (steps.length === 0) {
      steps.push({
        stepName: execution.workflows?.name || "Execution",
        status: execution.status,
        startTime: execution.started_at?.toISOString() || null,
        endTime: execution.finished_at?.toISOString() || null,
        durationMs: execution.execution_time_ms || 
          (execution.started_at && execution.finished_at
            ? new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()
            : null),
      });
    }

    // Build error object if execution failed
    let errorObj: ExecutionDetail["error"] = null;
    if (execution.status === "error" || execution.status === "failure") {
      errorObj = {
        message: execution.error_message || "Execution failed",
        stack: null, // Stack trace would come from execution metadata if available
        cause: null, // Cause would come from execution metadata if available
      };
    }

    const executionDetail: ExecutionDetail & { workflowId?: string; workflowName?: string } = {
      id: execution.id,
      status: execution.status,
      createdAt: execution.created_at.toISOString(),
      startedAt: execution.started_at?.toISOString() || null,
      finishedAt: execution.finished_at?.toISOString() || null,
      durationMs: execution.execution_time_ms || 
        (execution.started_at && execution.finished_at
          ? new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()
          : null),
      triggerType: null, // Would come from workflow trigger if available
      workflowVersion: null, // Would come from workflow version if available
      steps,
      input: execution.input_data || {},
      output: execution.output_data || {},
      error: errorObj,
      workflowId: execution.workflows?.id,
      workflowName: execution.workflows?.name,
    };

    // Return execution detail directly to match UI expectations
    return NextResponse.json(executionDetail, { status: 200 });
  } catch (err) {
    logError("app/api/executions/[id]", err);
    return error(
      "Failed to load execution details. Please try again or contact support if the issue persists.",
      { status: 500 }
    );
  }
}

