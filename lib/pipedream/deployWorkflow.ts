// lib/pipedream/deployWorkflow.ts

import { WorkflowPlan } from "../workflow/types";
import { createWorkflow, PipedreamWorkflow } from "../pipedreamClient";

export type DeployResult =
  | { ok: true; workflowId: string }
  | { ok: false; error: string; details?: any };

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
    // Convert WorkflowPlan to Pipedream blueprint format
    const blueprint = {
      name: plan.name,
      description: plan.description || plan.intent,
      intent: plan.intent || "",
      trigger: {
        type: plan.trigger.type,
        config: plan.trigger.config || {},
      },
      actions: plan.actions.map((action) => ({
        id: action.id,
        type: action.type,
        config: action.params || {},
      })),
    };

    const workflow = await createWorkflow(blueprint);

    if (!workflow?.id) {
      return {
        ok: false,
        error:
          "Deployment succeeded but no workflow ID received from Pipedream. Unexpected response format.",
        details: workflow,
      };
    }

    return {
      ok: true,
      workflowId: workflow.id,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: "Network or fetch error while deploying workflow to Pipedream.",
      details: err?.message || err,
    };
  }
}

