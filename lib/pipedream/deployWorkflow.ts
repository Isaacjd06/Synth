// lib/pipedream/deployWorkflow.ts

import { WorkflowPlan } from "../workflow/types";
import { createWorkflow, setWorkflowActive, WorkflowBlueprint } from "../pipedreamClient";

export type DeployResult =
  | { ok: true; workflowId: string }
  | { ok: false; error: string; details?: unknown };

/**
 * Convert WorkflowPlan to WorkflowBlueprint format
 * This is an intermediate step before converting to Pipedream format
 */
function planToBlueprint(plan: WorkflowPlan): WorkflowBlueprint {
  return {
    name: plan.name,
    description: plan.description,
    intent: plan.intent || "",
    trigger: {
      type: plan.trigger.type,
      config: plan.trigger.config || {},
    },
    actions: plan.actions.map((action) => ({
      id: action.id, // Required: Include id field for step identification
      type: action.type,
      config: action.params || {}, // Map params to config
    })),
  };
}

/**
 * Deploy a workflow to Pipedream by converting WorkflowPlan to Pipedream format
 * and POSTing it to the Pipedream REST API.
 * 
 * MVP: This is the ONLY execution engine used during MVP.
 */
export async function deployWorkflow(
  plan: WorkflowPlan
): Promise<DeployResult> {
  const apiKey = process.env.PIPEDREAM_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Missing PIPEDREAM_API_KEY environment variable. Cannot deploy workflow.",
    };
  }

  try {
    // Convert WorkflowPlan to blueprint format
    const blueprint = planToBlueprint(plan);

    // Create workflow in Pipedream
    const workflow = await createWorkflow(blueprint);

    if (!workflow?.id) {
      return {
        ok: false,
        error:
          "Deployment succeeded but no workflow ID received from Pipedream. Unexpected response format.",
        details: workflow,
      };
    }

    // Activate the workflow in Pipedream
    // Note: Workflows are created inactive by default for safety
    await setWorkflowActive(workflow.id, true);

    return {
      ok: true,
      workflowId: workflow.id,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      ok: false,
      error: "Network or fetch error while deploying workflow to Pipedream.",
      details: error?.message || err,
    };
  }
}

