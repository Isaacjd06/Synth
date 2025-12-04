/**
 * Pipedream REST API Client
 * 
 * Provides utilities for interacting with Pipedream's REST API
 * Documentation: https://pipedream.com/docs/api/
 * 
 * MVP: This is the ONLY execution engine used during MVP.
 */

const PIPEDREAM_API_URL = process.env.PIPEDREAM_API_URL || 'https://api.pipedream.com/v1';
const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;

if (!PIPEDREAM_API_KEY) {
  console.warn('Warning: PIPEDREAM_API_KEY is not set in environment variables');
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
 * Synth workflow blueprint structure (from Neon database)
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
  if (!PIPEDREAM_API_KEY) {
    console.error('❌ [Pipedream Client] PIPEDREAM_API_KEY is not configured');
    throw new Error('PIPEDREAM_API_KEY is not configured');
  }

  const url = `${PIPEDREAM_API_URL}${endpoint}`;
  const method = options.method || 'GET';
  console.log(`🌐 [Pipedream Client] ${method} ${url}`);

  const headers = {
    'Authorization': `Bearer ${PIPEDREAM_API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [Pipedream Client] API error (${response.status}):`, errorText);
    throw new Error(
      `Pipedream API error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = await response.json();
  console.log(`✅ [Pipedream Client] ${method} ${url} - Success`);
  return data;
}

/**
 * Convert Synth workflow blueprint to Pipedream workflow format
 * 
 * Note: This conversion will be refined once Pipedream API format is confirmed.
 */
export function blueprintToPipedreamWorkflow(blueprint: WorkflowBlueprint): PipedreamWorkflow {
  return {
    name: blueprint.name,
    description: blueprint.description || blueprint.intent,
    trigger: blueprint.trigger,
    steps: blueprint.actions.map((action, index) => ({
      id: action.id || `step_${index}`,
      type: action.type,
      config: action.config || {},
    })),
    active: false,
  };
}

/**
 * Create a new workflow in Pipedream
 */
export async function createWorkflow(
  blueprint: WorkflowBlueprint
): Promise<PipedreamWorkflow> {
  console.log(`🔧 [Pipedream Client] Converting blueprint to Pipedream workflow format: "${blueprint.name}"`);
  const pipedreamWorkflow = blueprintToPipedreamWorkflow(blueprint);
  console.log(`📤 [Pipedream Client] Sending workflow to Pipedream with ${pipedreamWorkflow.steps.length} steps`);

  const response = await pipedreamRequest<PipedreamWorkflow>(
    '/workflows',
    {
      method: 'POST',
      body: JSON.stringify(pipedreamWorkflow),
    }
  );

  console.log(`✅ [Pipedream Client] Workflow created successfully with ID: ${response.id}`);
  return response;
}

/**
 * Get a workflow by ID from Pipedream
 */
export async function getWorkflow(workflowId: string): Promise<PipedreamWorkflow> {
  return pipedreamRequest<PipedreamWorkflow>(`/workflows/${workflowId}`);
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

