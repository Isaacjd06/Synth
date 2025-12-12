/**
 * API Response Types
 * 
 * Type definitions for all API route responses
 */

// ============================================================================
// Dashboard
// ============================================================================

export interface DashboardSummaryResponse {
  activeWorkflows: number;
  totalExecutions: number;
  executionsLast24h: number; // Fixed: UI expects executionsLast24h
  successRate: number;
}

export interface RecentExecution {
  id: string;
  workflow_id: string;
  status: string;
  created_at: string;
  workflow: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Skills
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  stepsPreview: string;
  active: boolean;
  executionCount: number;
  requiredPlan?: "starter" | "pro" | "agency";
}

// ============================================================================
// Workflows
// ============================================================================

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  lastRun: string | null;
  runCount: number;
  readOnly: boolean;
}

export interface WorkflowDetail {
  id: string;
  name: string;
  intent: string | null;
  active: boolean;
  trigger: {
    type: string;
    config: unknown;
  } | null;
  steps: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    metadata: unknown;
  }>;
  stats: {
    totalRuns: number;
    avgTime: number;
    successRate: number;
    lastRunAt: string | null;
  };
  timeline: Array<{
    date: string;
    runs: number;
    successes: number;
    failures: number;
  }>;
}

// ============================================================================
// Executions
// ============================================================================

export interface ExecutionListItem {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  createdAt: string;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface ExecutionDetail {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  triggerType: string | null;
  workflowVersion: string | null;
  steps: Array<{
    stepName: string;
    status: string;
    startTime: string | null;
    endTime: string | null;
    durationMs: number | null;
  }>;
  input: unknown;
  output: unknown;
  error: {
    message: string;
    stack: string | null;
    cause: string | null;
  } | null;
}

// ============================================================================
// Insights
// ============================================================================

export interface InsightsResult {
  automationsToOptimize: Array<{
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "error";
    workflowId?: string;
  }>;
  suggestedSkills: Array<{
    id: string;
    title: string;
    description: string;
    skillId?: string;
  }>;
  performanceWarnings: Array<{
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "error";
    workflowId?: string;
  }>;
}

// Legacy type alias for backward compatibility
export type InsightsResponse = InsightsResult;

// ============================================================================
// Execution Engine
// ============================================================================

/**
 * Response from running a workflow
 */
export interface RunWorkflowResponse {
  executionId: string;
  status: "success" | "error" | "failure" | "running" | "unknown";
  durationMs: number | null;
  startedAt: string; // ISO date string
  finishedAt: string | null; // ISO date string
  outputPreview: {
    keys: string[];
  } | null;
}

/**
 * Response from retrying an execution
 */
export type RetryExecutionResponse = RunWorkflowResponse;

/**
 * Normalized execution result from execution engine
 * Used internally by execution engine and providers
 * Note: This is the internal format with Date objects
 * The API response format uses ISO strings
 */
export interface NormalizedExecutionResult {
  status: "success" | "error" | "failure" | "running" | "unknown";
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

