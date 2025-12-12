/**
 * Pipedream API Client for Synth
 * 
 * Provides functions for interacting with Pipedream's REST API
 * to create, update, run workflows and fetch executions.
 * 
 * Environment Variables Required:
 * - PIPEDREAM_API_KEY: Pipedream API authentication key
 * - PIPEDREAM_API_URL: Base URL for Pipedream API (defaults to https://api.pipedream.com/v1)
 * - PIPEDREAM_USER_ID: Workspace/user ID for creating workflows
 */

import { WorkflowBlueprint } from "@/lib/schemas/workflowSchema";

// Get environment variables at runtime (not module load time)
const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || "https://api.pipedream.com/v1";
const PIPEDREAM_USER_ID = process.env.PIPEDREAM_USER_ID;

/**
 * Custom error class for Pipedream API errors
 */
export class PipedreamError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = "PipedreamError";
  }
}

/**
 * Result type for workflow creation/update operations
 */
export interface CreateWorkflowResult {
  pipedream_workflow_id: string;
  metadata?: Record<string, unknown>;
}

/**
 * Execution record from Pipedream
 */
export interface PipedreamExecution {
  id: string;
  workflow_id: string;
  status: "success" | "failure" | "running" | "error";
  started_at: string;
  finished_at?: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  if (!PIPEDREAM_API_KEY) {
    throw new PipedreamError(
      "PIPEDREAM_API_KEY is not configured. Please set it in your environment variables."
    );
  }
  if (!PIPEDREAM_USER_ID) {
    throw new PipedreamError(
      "PIPEDREAM_USER_ID is not configured. Please set it in your environment variables."
    );
  }
}

/**
 * Make authenticated request to Pipedream API
 */
async function pipedreamRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  validateEnv();

  const url = `${PIPEDREAM_API_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    Authorization: `Bearer ${PIPEDREAM_API_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const errorMessage = typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
        ? String((errorBody as { message: unknown }).message)
        : String(errorBody);

      throw new PipedreamError(
        `Pipedream API error (${response.status}): ${errorMessage || response.statusText}`,
        response.status,
        errorBody
      );
    }

    // Handle empty responses (e.g., DELETE requests)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      // For non-JSON responses, return empty object cast to T
      return {} as T;
    }
  } catch (err) {
    if (err instanceof PipedreamError) {
      throw err;
    }
    // Network or other errors
    throw new PipedreamError(
      `Failed to communicate with Pipedream API: ${err instanceof Error ? err.message : "Unknown error"}`,
      undefined,
      err
    );
  }
}

/**
 * Convert Synth workflow blueprint to Pipedream workflow format
 * 
 * Maps the Synth blueprint structure to Pipedream's expected format
 */
function blueprintToPipedreamFormat(blueprint: WorkflowBlueprint): Record<string, unknown> {
  // Convert actions to Pipedream steps
  const steps = blueprint.actions.map((action, index) => ({
    id: `step_${index + 1}`,
    type: `${action.app}_${action.operation}`,
    config: {
      ...action.config,
      app: action.app,
      operation: action.operation,
    },
  }));

  return {
    name: blueprint.name,
    description: blueprint.description || "",
    trigger: {
      type: `${blueprint.trigger.app}_${blueprint.trigger.type}`,
      config: {
        ...blueprint.trigger.config,
        app: blueprint.trigger.app,
      },
    },
    steps,
    active: false, // Workflows are created inactive by default
  };
}

/**
 * Create a new workflow in Pipedream
 * 
 * @param blueprint - Synth workflow blueprint JSON
 * @returns Created workflow ID and metadata
 */
export async function createWorkflow(
  blueprint: WorkflowBlueprint
): Promise<CreateWorkflowResult> {
  validateEnv();

  const pipedreamWorkflow = blueprintToPipedreamFormat(blueprint);

  try {
    const response = await pipedreamRequest<Record<string, unknown>>(
      `/users/${PIPEDREAM_USER_ID}/workflows`,
      {
        method: "POST",
        body: JSON.stringify(pipedreamWorkflow),
      }
    );

    return {
      pipedream_workflow_id: String(response.id || response.workflow_id),
      metadata: {
        name: response.name,
        created_at: response.created_at,
        ...response,
      },
    };
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to create workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

/**
 * Update an existing Pipedream workflow with a new blueprint
 * 
 * @param pipedreamWorkflowId - The Pipedream workflow ID to update
 * @param blueprint - Updated Synth workflow blueprint JSON
 * @returns Updated workflow ID and metadata
 */
export async function updateWorkflow(
  pipedreamWorkflowId: string,
  blueprint: WorkflowBlueprint
): Promise<CreateWorkflowResult> {
  validateEnv();

  if (!pipedreamWorkflowId) {
    throw new PipedreamError("pipedreamWorkflowId is required");
  }

  const pipedreamWorkflow = blueprintToPipedreamFormat(blueprint);

  try {
    const response = await pipedreamRequest<Record<string, unknown>>(
      `/users/${PIPEDREAM_USER_ID}/workflows/${pipedreamWorkflowId}`,
      {
        method: "PUT",
        body: JSON.stringify(pipedreamWorkflow),
      }
    );

    return {
      pipedream_workflow_id: String(response.id || response.workflow_id || pipedreamWorkflowId),
      metadata: {
        name: response.name,
        updated_at: response.updated_at,
        ...response,
      },
    };
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to update workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

/**
 * Trigger a manual run of a workflow in Pipedream
 * 
 * @param pipedreamWorkflowId - The Pipedream workflow ID to run
 * @param inputData - Optional input data to pass to the workflow
 * @returns Execution ID and status
 */
export async function runWorkflow(
  pipedreamWorkflowId: string,
  inputData?: Record<string, unknown>
): Promise<PipedreamExecution> {
  validateEnv();

  if (!pipedreamWorkflowId) {
    throw new PipedreamError("pipedreamWorkflowId is required");
  }

  try {
    const response = await pipedreamRequest<PipedreamExecution>(
      `/users/${PIPEDREAM_USER_ID}/workflows/${pipedreamWorkflowId}/execute`,
      {
        method: "POST",
        body: JSON.stringify(inputData || {}), // Include input data if provided
      }
    );

    return response;
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to run workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

/**
 * Fetch recent workflow execution logs from Pipedream
 * 
 * @param pipedreamWorkflowId - The Pipedream workflow ID
 * @returns Array of execution records
 */
export async function listExecutions(
  pipedreamWorkflowId: string
): Promise<PipedreamExecution[]> {
  validateEnv();

  if (!pipedreamWorkflowId) {
    throw new PipedreamError("pipedreamWorkflowId is required");
  }

  try {
    const response = await pipedreamRequest<{
      data?: PipedreamExecution[];
      executions?: PipedreamExecution[];
      [key: string]: unknown;
    }>(
      `/users/${PIPEDREAM_USER_ID}/workflows/${pipedreamWorkflowId}/executions`,
      {
        method: "GET",
      }
    );

    // Handle different response formats
    const executions = response.data || response.executions || [];
    
    return Array.isArray(executions) ? executions : [];
  } catch (error) {
    if (error instanceof PipedreamError) {
      throw error;
    }
    throw new PipedreamError(
      `Failed to list executions: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error
    );
  }
}

