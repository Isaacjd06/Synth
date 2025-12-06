// lib/pipedream/runWorkflow.ts

import { executeWorkflow, PipedreamExecution } from "../pipedreamClient";

export type RunResult =
  | { ok: true; execution: PipedreamExecution }
  | { ok: false; error: string; details?: unknown };

/**
 * Execute a workflow in Pipedream
 * 
 * MVP: This is the ONLY execution engine used during MVP.
 */
export async function runWorkflow(
  workflowId: string,
  inputData?: Record<string, unknown>
): Promise<RunResult> {
  const apiKey = process.env.PIPEDREAM_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Missing PIPEDREAM_API_KEY environment variable. Cannot execute workflow.",
    };
  }

  try {
    const execution = await executeWorkflow(workflowId, inputData);

    return {
      ok: true,
      execution,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      ok: false,
      error: "Network or fetch error while executing workflow in Pipedream.",
      details: error?.message || err,
    };
  }
}

