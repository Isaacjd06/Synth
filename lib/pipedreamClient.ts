/**
 * Pipedream REST API Client
 * 
 * Provides utilities for interacting with Pipedream's REST API
 * Documentation: https://pipedream.com/docs/api/
 * 
 * MVP: This is the ONLY execution engine used during MVP.
 */

// Environment variables are accessed at runtime, not at module load time
// This allows the module to be imported during build without requiring env vars
const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || 'https://api.pipedream.com/v1';

/**
 * Custom error class for Pipedream API errors
 */
export class PipedreamAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: any
  ) {
    super(message);
    this.name = 'PipedreamAPIError';
  }
}

/**
 * Get Pipedream API key at runtime
 * Throws error if not configured when actually making API calls
 */
function getPipedreamApiKey(): string {
  const apiKey = process.env.PIPEDREAM_API_KEY;
  if (!apiKey) {
    throw new PipedreamAPIError('PIPEDREAM_API_KEY is not configured. Please set it in your environment variables.');
  }
  return apiKey;
}

/**
 * Pipedream Workflow structure
 * 
 * Note: This structure will be updated once actual Pipedream API format is confirmed.
 * For MVP, we use a generic structure that can be adapted.
 */
export interface PipedreamWorkflow {
  id?: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  active?: boolean;
}

/**
 * Pipedream Execution response structure
 */
export interface PipedreamExecution {
  id: string;
  workflow_id: string;
  status: 'success' | 'error' | 'running';
  started_at: string;
  finished_at?: string;
  data?: {
    input?: any;
    output?: any;
  };
}

/**
 * Synth workflow blueprint structure (intermediate format for conversion)
 */
export interface WorkflowBlueprint {
  name: string;
  description?: string;
  intent: string;
  trigger: {
    type: string;
    config: Record<string, any>;
  };
  actions: Array<{
    id: string; // Required: id field for step identification
    type: string;
    config: Record<string, any>;
  }>;
}

/**
 * Make authenticated request to Pipedream API
 */
async function pipedreamRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get API key at runtime (not at module load time)
  const apiKey = getPipedreamApiKey();

  const url = `${PIPEDREAM_API_URL}${endpoint}`;
  const method = options.method || 'GET';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      throw new PipedreamAPIError(
        `Pipedream API error (${response.status}): ${errorBody?.message || errorBody || response.statusText}`,
        response.status,
        errorBody
      );
    }

    // Handle empty responses (e.g., DELETE requests)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      // For non-JSON responses or empty bodies, return undefined cast to T
      return undefined as T;
    }
  } catch (err) {
    if (err instanceof PipedreamAPIError) {
      throw err;
    }
    // Network or other errors
    throw new PipedreamAPIError(
      `Failed to communicate with Pipedream API: ${err instanceof Error ? err.message : 'Unknown error'}`,
      undefined,
      err
    );
  }
}

/**
 * Convert Synth workflow blueprint to Pipedream workflow format
 * 
 * Pipedream workflows use a linear step sequence. For MVP, we convert
 * the graph structure (onSuccessNext/onFailureNext) to a simple linear order.
 * 
 * Note: This conversion handles the MVP case where workflows are mostly linear.
 * Complex branching will be handled in future iterations.
 */
export function blueprintToPipedreamWorkflow(blueprint: WorkflowBlueprint): PipedreamWorkflow {
  // Convert actions to Pipedream steps in order
  // For MVP, we use the order they appear in the actions array
  // Future: Implement proper graph-to-sequence conversion based on onSuccessNext
  const steps = blueprint.actions.map((action, index) => ({
    id: action.id || `step_${index}`,
    type: action.type,
    config: action.config || {},
  }));

  return {
    name: blueprint.name,
    description: blueprint.description || blueprint.intent,
    trigger: blueprint.trigger,
    steps,
    active: false,
  };
}

/**
 * Create a new workflow in Pipedream
 */
export async function createWorkflow(
  blueprint: WorkflowBlueprint
): Promise<PipedreamWorkflow> {
  const pipedreamWorkflow = blueprintToPipedreamWorkflow(blueprint);

  const response = await pipedreamRequest<PipedreamWorkflow>(
    '/workflows',
    {
      method: 'POST',
      body: JSON.stringify(pipedreamWorkflow),
    }
  );

  return response;
}

/**
 * Get a workflow by ID from Pipedream
 */
export async function getWorkflow(workflowId: string): Promise<PipedreamWorkflow> {
  return pipedreamRequest<PipedreamWorkflow>(`/workflows/${workflowId}`);
}

/**
 * Update an existing workflow in Pipedream
 */
export async function updateWorkflow(
  workflowId: string,
  blueprint: WorkflowBlueprint
): Promise<PipedreamWorkflow> {
  const pipedreamWorkflow = blueprintToPipedreamWorkflow(blueprint);

  return pipedreamRequest<PipedreamWorkflow>(
    `/workflows/${workflowId}`,
    {
      method: 'PUT',
      body: JSON.stringify(pipedreamWorkflow),
    }
  );
}

/**
 * Delete a workflow from Pipedream
 * 
 * Optional for MVP, but useful for cleanup
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  await pipedreamRequest<void>(
    `/workflows/${workflowId}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Activate or deactivate a workflow in Pipedream
 */
export async function setWorkflowActive(
  workflowId: string,
  active: boolean
): Promise<PipedreamWorkflow> {
  return pipedreamRequest<PipedreamWorkflow>(
    `/workflows/${workflowId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }
  );
}

/**
 * Execute a workflow manually in Pipedream
 */
export async function executeWorkflow(
  workflowId: string,
  inputData?: Record<string, any>
): Promise<PipedreamExecution> {
  return pipedreamRequest<PipedreamExecution>(
    `/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      body: JSON.stringify(inputData || {}),
    }
  );
}

/**
 * Get execution by ID from Pipedream
 */
export async function getExecution(executionId: string): Promise<PipedreamExecution> {
  return pipedreamRequest<PipedreamExecution>(`/executions/${executionId}`);
}

