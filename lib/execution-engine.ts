/**
 * Execution Engine Abstraction
 * 
 * Provides a generic interface for executing workflows across different providers.
 * Currently supports Pipedream, but designed to be extensible to n8n or other providers.
 */

import type { SubscriptionPlan } from "./subscription-client";

/**
 * Normalized workflow definition for execution
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  pipedream_workflow_id: string | null;
  active: boolean;
  trigger: unknown;
  actions: unknown;
}

/**
 * Execution input payload
 */
export interface ExecutionInput {
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * User context for execution
 */
export interface ExecutionUser {
  id: string;
  subscription_plan: SubscriptionPlan;
}

/**
 * Normalized execution result
 * This is what all providers must return, regardless of their internal format
 */
export interface NormalizedExecutionResult {
  status: "success" | "error" | "failure" | "running";
  providerExecutionId: string | null;
  output: Record<string, unknown> | null;
  error: {
    message: string;
    stack?: string | null;
    cause?: string | null;
  } | null;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  steps?: Array<{
    stepName: string;
    status: string;
    startTime: string | null;
    endTime: string | null;
    durationMs: number | null;
    input?: Record<string, unknown> | null;
    output?: Record<string, unknown> | null;
    error?: {
      message: string;
      stack?: string | null;
      cause?: string | null;
    } | null;
  }>;
}

/**
 * Execution engine options
 */
export interface RunWorkflowOptions {
  workflow: WorkflowDefinition;
  input: ExecutionInput;
  user: ExecutionUser;
}

/**
 * Run a workflow using the appropriate provider
 * 
 * @param options - Workflow execution options
 * @returns Normalized execution result
 */
export async function runWorkflow(
  options: RunWorkflowOptions
): Promise<NormalizedExecutionResult> {
  const { workflow, input, user } = options;

  // Validate workflow has a provider mapping
  if (!workflow.pipedream_workflow_id) {
    throw new Error(
      "Workflow is not activated. Please activate the workflow first."
    );
  }

  if (!workflow.active) {
    throw new Error("Workflow is not active. Please activate the workflow first.");
  }

  // For now, we only support Pipedream
  // In the future, we can add provider selection logic here
  const { executePipedreamWorkflow } = await import("./providers/pipedream-executor");
  
  return executePipedreamWorkflow({
    pipedreamWorkflowId: workflow.pipedream_workflow_id,
    input: input.payload || input,
    user,
  });
}
