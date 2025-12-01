// lib/n8n/deployWorkflow.ts

import { N8nWorkflow } from "../workflow/builder";

export type DeployResult =
  | { ok: true; workflowId: number }
  | { ok: false; error: string; details?: any };

/**
 * Deploy an n8n workflow by POSTing it to the n8n REST API.
 * Uses N8N_API_URL + N8N_API_KEY for authentication.
 */
export async function deployWorkflow(
  workflow: N8nWorkflow
): Promise<DeployResult> {
  const apiUrl = process.env.N8N_API_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      ok: false,
      error:
        "Missing N8N_API_URL or N8N_API_KEY environment variables. Cannot deploy workflow.",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `Failed to deploy workflow. HTTP ${response.status}`,
        details: text,
      };
    }

    const result = await response.json();

    // n8n returns something like: { id: <number>, ... }
    if (!result?.id) {
      return {
        ok: false,
        error:
          "Deployment succeeded but no workflow ID received from n8n. Unexpected response format.",
        details: result,
      };
    }

    return {
      ok: true,
      workflowId: result.id,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: "Network or fetch error while deploying workflow to n8n.",
      details: err?.message || err,
    };
  }
}
