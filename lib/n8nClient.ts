/**
 * FUTURE: n8n REST API Client
 * 
 * ⚠️ NOT USED IN MVP ⚠️
 * 
 * This file is kept for future n8n support. During MVP, Synth uses ONLY Pipedream
 * as the execution engine. Do not import or use this module during MVP development.
 * 
 * See: knowledge/architecture/n8n-logic.md
 * See: knowledge/architecture/pipedream-logic.md
 *
 * Provides utilities for interacting with n8n's REST API
 * Documentation: https://docs.n8n.io/api/
 */

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.warn('Warning: N8N_API_KEY is not set in environment variables');
}

/**
 * n8n Workflow node structure
 */
interface N8nWorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
}

/**
 * n8n Workflow connection structure
 */
interface N8nWorkflowConnectionNode {
  node: string;
  type: string;
  index: number;
}

interface N8nWorkflowConnection {
  [key: string]: {
    main: Array<Array<N8nWorkflowConnectionNode>>;
  };
}

/**
 * n8n Workflow structure
 */
export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nWorkflowNode[];
  connections: N8nWorkflowConnection;
  active: boolean;
  settings?: {
    saveManualExecutions?: boolean;
    saveExecutionProgress?: boolean;
    executionTimeout?: number;
  };
  staticData?: Record<string, unknown>;
  tags?: string[];
}

/**
 * n8n Execution response structure
 */
export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowData?: N8nWorkflow;
  data?: {
    resultData: {
      runData: Record<string, unknown>;
    };
  };
}

/**
 * Synth workflow blueprint structure (from Supabase)
 */
export interface WorkflowBlueprint {
  name: string;
  description?: string;
  intent: string;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * Make authenticated request to n8n API
 */
async function n8nRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!N8N_API_KEY) {
    console.error('❌ [n8n Client] N8N_API_KEY is not configured');
    throw new Error('N8N_API_KEY is not configured');
  }

  const url = `${N8N_URL}${endpoint}`;
  const method = options.method || 'GET';
  console.log(`🌐 [n8n Client] ${method} ${url}`);

  const headers = {
    'X-N8N-API-KEY': N8N_API_KEY,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [n8n Client] API error (${response.status}):`, errorText);
    throw new Error(
      `n8n API error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = await response.json();
  console.log(`✅ [n8n Client] ${method} ${url} - Success`);
  return data;
}

/**
 * Convert Synth workflow blueprint to n8n workflow format
 */
export function blueprintToN8nWorkflow(blueprint: WorkflowBlueprint): N8nWorkflow {
  const nodes: N8nWorkflowNode[] = [];
  const connections: N8nWorkflowConnection = {};

  // Create trigger node
  const triggerNode: N8nWorkflowNode = {
    id: 'trigger',
    name: 'Trigger',
    type: mapTriggerType(blueprint.trigger.type),
    typeVersion: 1,
    position: [250, 300],
    parameters: blueprint.trigger.config,
  };
  nodes.push(triggerNode);

  // Create action nodes and connect them
  let previousNodeId = 'trigger';
  blueprint.actions.forEach((action, index) => {
    const nodeId = `action_${index}`;
    const actionNode: N8nWorkflowNode = {
      id: nodeId,
      name: action.config.name || `Action ${index + 1}`,
      type: mapActionType(action.type),
      typeVersion: 1,
      position: [250 + (index + 1) * 200, 300],
      parameters: action.config,
    };
    nodes.push(actionNode);

    // Connect previous node to this node
    if (!connections[previousNodeId]) {
      connections[previousNodeId] = { main: [[]] };
    }
    connections[previousNodeId].main[0].push({
      node: nodeId,
      type: 'main',
      index: 0,
    });

    previousNodeId = nodeId;
  });

  return {
    name: blueprint.name,
    nodes,
    connections,
    active: false,
    settings: {
      saveManualExecutions: true,
      saveExecutionProgress: true,
    },
  };
}

/**
 * Map Synth trigger types to n8n node types
 */
function mapTriggerType(synthType: string): string {
  const typeMap: Record<string, string> = {
    manual: 'n8n-nodes-base.manualTrigger',
    webhook: 'n8n-nodes-base.webhook',
    schedule: 'n8n-nodes-base.scheduleTrigger',
    email: 'n8n-nodes-base.emailTrigger',
  };
  return typeMap[synthType] || 'n8n-nodes-base.manualTrigger';
}

/**
 * Map Synth action types to n8n node types
 */
function mapActionType(synthType: string): string {
  const typeMap: Record<string, string> = {
    http: 'n8n-nodes-base.httpRequest',
    email: 'n8n-nodes-base.emailSend',
    slack: 'n8n-nodes-base.slack',
    code: 'n8n-nodes-base.code',
    set: 'n8n-nodes-base.set',
  };
  return typeMap[synthType] || 'n8n-nodes-base.code';
}

/**
 * Create a new workflow in n8n
 */
export async function createWorkflow(
  blueprint: WorkflowBlueprint
): Promise<N8nWorkflow> {
  console.log(`🔧 [n8n Client] Converting blueprint to n8n workflow format: "${blueprint.name}"`);
  const n8nWorkflow = blueprintToN8nWorkflow(blueprint);
  console.log(`📤 [n8n Client] Sending workflow to n8n with ${n8nWorkflow.nodes.length} nodes`);

  const response = await n8nRequest<{ data: N8nWorkflow }>(
    '/api/v1/workflows',
    {
      method: 'POST',
      body: JSON.stringify(n8nWorkflow),
    }
  );

  console.log('🔍 [n8n Client] Raw response from n8n:', JSON.stringify(response, null, 2));

  // n8n API returns the workflow directly, not wrapped in { data: ... }
  const responseData = response as Record<string, unknown>;
  const workflowData = (responseData.data || response) as N8nWorkflow;
  console.log(`✅ [n8n Client] Workflow created successfully with ID: ${workflowData.id}`);
  return workflowData;
}

/**
 * Get a workflow by ID from n8n
 */
export async function getWorkflow(workflowId: string): Promise<N8nWorkflow> {
  const response = await n8nRequest<{ data: N8nWorkflow }>(
    `/api/v1/workflows/${workflowId}`
  );
  return response.data;
}

/**
 * Activate or deactivate a workflow in n8n
 */
export async function setWorkflowActive(
  workflowId: string,
  active: boolean
): Promise<N8nWorkflow> {
  const response = await n8nRequest<{ data: N8nWorkflow }>(
    `/api/v1/workflows/${workflowId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }
  );
  return response.data;
}

/**
 * Execute a workflow manually in n8n
 */
export async function executeWorkflow(
  workflowId: string,
  inputData?: Record<string, unknown>
): Promise<N8nExecution> {
  const response = await n8nRequest<{ data: N8nExecution }>(
    `/api/v1/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      body: JSON.stringify(inputData || {}),
    }
  );
  return response.data;
}

/**
 * Get all executions from n8n (with optional filtering)
 */
export async function getExecutions(params?: {
  workflowId?: string;
  limit?: number;
  status?: 'success' | 'error' | 'waiting';
}): Promise<N8nExecution[]> {
  const queryParams = new URLSearchParams();
  if (params?.workflowId) queryParams.append('workflowId', params.workflowId);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const endpoint = `/api/v1/executions${queryParams.toString() ? `?${queryParams}` : ''}`;

  const response = await n8nRequest<{ data: N8nExecution[] }>(endpoint);
  return response.data;
}

/**
 * Get a single execution by ID from n8n
 */
export async function getExecution(executionId: string): Promise<N8nExecution> {
  const response = await n8nRequest<{ data: N8nExecution }>(
    `/api/v1/executions/${executionId}`
  );
  return response.data;
}

/**
 * Delete a workflow from n8n
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  await n8nRequest(`/api/v1/workflows/${workflowId}`, {
    method: 'DELETE',
  });
}
