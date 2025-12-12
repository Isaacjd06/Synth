/**
 * Pipedream Workflow Executor
 * 
 * Handles execution of workflows via Pipedream's REST API.
 * This is the provider-specific implementation for the execution engine.
 */

import { runWorkflow as pipedreamRunWorkflow, PipedreamError } from "@/lib/pipedream";
import type { NormalizedExecutionResult } from "../execution-engine";
import type { SubscriptionPlan } from "../subscription-client";

/**
 * Options for executing a Pipedream workflow
 */
export interface PipedreamExecutionOptions {
  pipedreamWorkflowId: string;
  input: Record<string, unknown>;
  user: {
    id: string;
    subscription_plan: SubscriptionPlan;
  };
}

/**
 * Execute a workflow in Pipedream
 * 
 * This function:
 * 1. Triggers the workflow via Pipedream API
 * 2. Waits for completion (or polls if async)
 * 3. Normalizes the response into our standard format
 * 
 * @param options - Execution options
 * @returns Normalized execution result
 */
export async function executePipedreamWorkflow(
  options: PipedreamExecutionOptions
): Promise<NormalizedExecutionResult> {
  const { pipedreamWorkflowId, input } = options;
  const startedAt = new Date();

  try {
    // Trigger the workflow in Pipedream
    const pipedreamExecution = await pipedreamRunWorkflow(
      pipedreamWorkflowId,
      input
    );

    // Parse execution times
    const executionStartedAt = pipedreamExecution.started_at
      ? new Date(pipedreamExecution.started_at)
      : startedAt;
    
    const executionFinishedAt = pipedreamExecution.finished_at
      ? new Date(pipedreamExecution.finished_at)
      : null;

    // Calculate duration
    const durationMs = executionFinishedAt
      ? executionFinishedAt.getTime() - executionStartedAt.getTime()
      : null;

    // Normalize status
    let normalizedStatus: NormalizedExecutionResult["status"] = "running";
    if (pipedreamExecution.status === "success") {
      normalizedStatus = "success";
    } else if (
      pipedreamExecution.status === "error" ||
      pipedreamExecution.status === "failure"
    ) {
      normalizedStatus = "error";
    }

    // Extract output data
    const output = pipedreamExecution.output_data || pipedreamExecution.data?.output || null;

    // Extract error information
    let error: NormalizedExecutionResult["error"] = null;
    if (normalizedStatus === "error") {
      const errorMessage = pipedreamExecution.error || 
        (typeof output === "object" && output !== null && "error" in output
          ? String((output as { error: unknown }).error)
          : "Execution failed");
      
      error = {
        message: errorMessage,
        stack: null, // Pipedream may not provide stack traces
        cause: null,
      };
    }

    // Build steps array (simplified for MVP)
    // In the future, we can extract step-level detail from Pipedream's response
    const steps: NormalizedExecutionResult["steps"] = [];
    
    // If Pipedream provides step-level data, extract it
    if (pipedreamExecution.steps && Array.isArray(pipedreamExecution.steps)) {
      steps.push(...pipedreamExecution.steps.map((step: unknown) => {
        const stepObj = step as Record<string, unknown>;
        return {
          stepName: String(stepObj.name || stepObj.id || "Step"),
          status: String(stepObj.status || normalizedStatus),
          startTime: stepObj.started_at ? String(stepObj.started_at) : null,
          endTime: stepObj.finished_at ? String(stepObj.finished_at) : null,
          durationMs: stepObj.duration_ms 
            ? Number(stepObj.duration_ms)
            : null,
          input: stepObj.input as Record<string, unknown> | null,
          output: stepObj.output as Record<string, unknown> | null,
          error: stepObj.error ? {
            message: String(stepObj.error),
            stack: null,
            cause: null,
          } : null,
        };
      }));
    } else {
      // Create a single step representing the entire workflow execution
      steps.push({
        stepName: "Workflow Execution",
        status: normalizedStatus,
        startTime: executionStartedAt.toISOString(),
        endTime: executionFinishedAt?.toISOString() || null,
        durationMs,
        input: input || null,
        output: output as Record<string, unknown> | null,
        error,
      });
    }

    const result: NormalizedExecutionResult = {
      status: normalizedStatus,
      providerExecutionId: pipedreamExecution.id || null,
      output: output as Record<string, unknown> | null,
      error,
      startedAt: executionStartedAt,
      finishedAt: executionFinishedAt,
      durationMs,
      steps,
    };

    return result;
  } catch (err) {
    // Handle Pipedream API errors
    if (err instanceof PipedreamError) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      return {
        status: "error",
        providerExecutionId: null,
        output: null,
        error: {
          message: err.message,
          stack: err.stack || null,
          cause: err.responseBody ? String(err.responseBody) : null,
        },
        startedAt,
        finishedAt,
        durationMs,
        steps: [
          {
            stepName: "Workflow Execution",
            status: "error",
            startTime: startedAt.toISOString(),
            endTime: finishedAt.toISOString(),
            durationMs,
            input: input || null,
            output: null,
            error: {
              message: err.message,
              stack: err.stack || null,
              cause: err.responseBody ? String(err.responseBody) : null,
            },
          },
        ],
      };
    }

    // Handle unexpected errors
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    return {
      status: "error",
      providerExecutionId: null,
      output: null,
      error: {
        message: err instanceof Error ? err.message : "Unknown error occurred",
        stack: err instanceof Error ? err.stack || null : null,
        cause: null,
      },
      startedAt,
      finishedAt,
      durationMs,
      steps: [
        {
          stepName: "Workflow Execution",
          status: "error",
          startTime: startedAt.toISOString(),
          endTime: finishedAt.toISOString(),
          durationMs,
          input: input || null,
          output: null,
          error: {
            message: err instanceof Error ? err.message : "Unknown error occurred",
            stack: err instanceof Error ? err.stack || null : null,
            cause: null,
          },
        },
      ],
    };
  }
}
