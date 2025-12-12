/**
 * Execution Logger
 * 
 * Handles creating and updating execution records in the database.
 * Provides a clean interface for the execution engine to log execution lifecycle.
 */

import { prisma } from "@/lib/prisma";
import type { NormalizedExecutionResult } from "./execution-engine";

/**
 * Options for starting an execution log
 */
export interface StartExecutionLogOptions {
  workflowId: string;
  userId: string;
  input: Record<string, unknown>;
}

/**
 * Options for completing an execution log
 */
export interface CompleteExecutionLogOptions {
  executionId: string;
  result: NormalizedExecutionResult;
}

/**
 * Options for updating an execution with error
 */
export interface UpdateExecutionWithErrorOptions {
  executionId: string;
  error: {
    message: string;
    stack?: string | null;
    cause?: string | null;
  };
}

/**
 * Start an execution log
 * Creates a new execution record with status "running"
 * 
 * @param options - Execution start options
 * @returns Execution ID
 */
export async function startExecutionLog(
  options: StartExecutionLogOptions
): Promise<string> {
  const { workflowId, userId, input } = options;
  const startedAt = new Date();

  const execution = await prisma.executions.create({
    data: {
      workflow_id: workflowId,
      user_id: userId,
      input_data: input as unknown,
      status: "running",
      started_at: startedAt,
      created_at: startedAt,
    },
  });

  return execution.id;
}

/**
 * Complete an execution log
 * Updates the execution record with final status, output, and timing
 * 
 * @param options - Execution completion options
 */
export async function completeExecutionLog(
  options: CompleteExecutionLogOptions
): Promise<void> {
  const { executionId, result } = options;

  // Store output data with steps if available
  const outputData: Record<string, unknown> = {
    ...(result.output || {}),
  };

  // If steps are available, store them in output_data for retrieval
  if (result.steps && result.steps.length > 0) {
    outputData.steps = result.steps;
  }

  await prisma.executions.update({
    where: { id: executionId },
    data: {
      status: result.status,
      output_data: outputData as unknown,
      error_message: result.error?.message || null,
      pipedream_execution_id: result.providerExecutionId || null,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      execution_time_ms: result.durationMs,
    },
  });
}

/**
 * Update an execution with error information
 * Used when execution fails before the engine can complete normally
 * 
 * @param options - Error update options
 */
export async function updateExecutionWithError(
  options: UpdateExecutionWithErrorOptions
): Promise<void> {
  const { executionId, error } = options;
  const finishedAt = new Date();

  // Get the execution to calculate duration
  const execution = await prisma.executions.findUnique({
    where: { id: executionId },
    select: { started_at: true },
  });

  const startedAt = execution?.started_at || finishedAt;
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  await prisma.executions.update({
    where: { id: executionId },
    data: {
      status: "error",
      error_message: error.message,
      finished_at: finishedAt,
      execution_time_ms: durationMs,
    },
  });
}
