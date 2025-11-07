import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.N8N_URL || !process.env.N8N_API_KEY) {
      console.error("ERROR: N8N_URL or N8N_API_KEY is missing from environment variables");
      return NextResponse.json(
        { error: "N8N_URL and N8N_API_KEY must be set in environment variables" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body as JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { workflow_id } = body;

    if (!workflow_id || typeof workflow_id !== "string") {
      return NextResponse.json(
        { error: "workflow_id is required and must be a string" },
        { status: 400 }
      );
    }

    // Fetch workflow from Supabase
    const { data: workflow, error: fetchError } = await supabaseServer
      .from("workflows")
      .select("*")
      .eq("id", workflow_id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch workflow:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch workflow: ${fetchError.message}` },
        { status: 404 }
      );
    }

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Check if workflow is already active
    if (workflow.active && workflow.n8n_workflow_id) {
      return NextResponse.json(
        { 
          message: "Workflow is already active",
          n8n_id: workflow.n8n_workflow_id 
        },
        { status: 200 }
      );
    }

    // Build n8n workflow JSON from trigger and actions
    const n8nWorkflow = buildN8nWorkflow(workflow);

    // Send workflow to n8n API
    console.log("Sending workflow to n8n:", process.env.N8N_URL);
    console.log("n8n workflow payload:", JSON.stringify(n8nWorkflow, null, 2));
    
    const n8nResponse = await fetch(`${process.env.N8N_URL}/rest/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify(n8nWorkflow),
    });

    console.log("n8n response status:", n8nResponse.status);
    console.log("n8n response headers:", Object.fromEntries(n8nResponse.headers.entries()));

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n API error response:", errorText);
      console.error("n8n response status:", n8nResponse.status);
      return NextResponse.json(
        { error: `n8n API error: ${n8nResponse.status} - ${errorText}` },
        { status: n8nResponse.status }
      );
    }

    let n8nWorkflowData;
    try {
      n8nWorkflowData = await n8nResponse.json();
      console.log("n8n response data:", JSON.stringify(n8nWorkflowData, null, 2));
    } catch (parseError) {
      console.error("Failed to parse n8n response as JSON:", parseError);
      const responseText = await n8nResponse.text();
      console.error("n8n response text:", responseText);
      return NextResponse.json(
        { error: "n8n API returned invalid JSON response" },
        { status: 500 }
      );
    }

    const n8nWorkflowId = n8nWorkflowData.id || n8nWorkflowData.data?.id;

    if (!n8nWorkflowId) {
      console.error("n8n response missing workflow ID:", JSON.stringify(n8nWorkflowData, null, 2));
      return NextResponse.json(
        { error: "n8n API did not return a workflow ID" },
        { status: 500 }
      );
    }

    // Update workflow in Supabase
    const { error: updateError } = await supabaseServer
      .from("workflows")
      .update({
        n8n_workflow_id: n8nWorkflowId,
        active: true,
      })
      .eq("id", workflow_id);

    if (updateError) {
      console.error("Failed to update workflow:", updateError);
      // Workflow was created in n8n but Supabase update failed
      // Return success but log the error
      console.error("Warning: Workflow activated in n8n but Supabase update failed");
      return NextResponse.json(
        {
          message: "Workflow activated in n8n, but failed to update database",
          n8n_id: n8nWorkflowId,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Workflow activated",
      n8n_id: n8nWorkflowId,
    });
  } catch (error) {
    console.error("Activate workflow error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Builds a valid n8n workflow JSON from the stored workflow data
 */
function buildN8nWorkflow(workflow: any): any {
  const nodes: any[] = [];
  let nodeIndex = 0;

  // Parse trigger and actions from JSONB columns
  const trigger = typeof workflow.trigger === 'string' 
    ? JSON.parse(workflow.trigger) 
    : workflow.trigger;
  const actions = typeof workflow.actions === 'string'
    ? JSON.parse(workflow.actions)
    : workflow.actions;

  // Create trigger node based on type
  const triggerNode = createTriggerNode(trigger, nodeIndex++);
  nodes.push(triggerNode);

  // Create action nodes
  const actionNodes = (actions || []).map((action: any, index: number) => {
    return createActionNode(action, nodeIndex++, index);
  });
  nodes.push(...actionNodes);

  // Build connections between nodes
  const connections: any = {};
  if (nodes.length > 1) {
    // Connect trigger to first action
    connections[triggerNode.name] = {
      main: [[{ node: nodes[1].name, type: "main", index: 0 }]],
    };
    
    // Connect actions in sequence
    for (let i = 1; i < nodes.length - 1; i++) {
      connections[nodes[i].name] = {
        main: [[{ node: nodes[i + 1].name, type: "main", index: 0 }]],
      };
    }
  }

  return {
    name: workflow.name || "Untitled Workflow",
    nodes,
    connections,
    settings: {
      executionOrder: "v1",
    },
    staticData: null,
    tags: [],
    triggerCount: 0,
    updatedAt: new Date().toISOString(),
    versionId: crypto.randomUUID(),
  };
}

/**
 * Creates an n8n trigger node based on the trigger type
 */
function createTriggerNode(trigger: any, index: number): any {
  const baseNode = {
    id: crypto.randomUUID(),
    name: `Trigger ${index + 1}`,
    type: "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    position: [250, 300 + index * 100],
    parameters: {},
  };

  switch (trigger?.type) {
    case "schedule":
      return {
        ...baseNode,
        type: "n8n-nodes-base.cron",
        name: "Schedule Trigger",
        parameters: {
          rule: {
            interval: [
              {
                field: "cronExpression",
                expression: trigger.condition || "0 0 * * *", // Default: daily
              },
            ],
          },
        },
      };

    case "webhook":
      return {
        ...baseNode,
        type: "n8n-nodes-base.webhook",
        name: "Webhook Trigger",
        parameters: {
          httpMethod: "POST",
          path: `webhook/${crypto.randomUUID()}`,
        },
        webhookId: crypto.randomUUID(),
      };

    case "event":
      // For event triggers, use a webhook as the base
      return {
        ...baseNode,
        type: "n8n-nodes-base.webhook",
        name: `Event Trigger: ${trigger.source || "unknown"}`,
        parameters: {
          httpMethod: "POST",
          path: `event/${trigger.source || "default"}`,
        },
        webhookId: crypto.randomUUID(),
      };

    case "manual":
    default:
      return baseNode;
  }
}

/**
 * Creates an n8n action node based on the action type
 */
function createActionNode(action: any, index: number, actionIndex: number): any {
  const baseNode = {
    id: crypto.randomUUID(),
    name: `Action ${actionIndex + 1}`,
    type: "n8n-nodes-base.noOp",
    typeVersion: 1,
    position: [450 + actionIndex * 200, 300 + index * 100],
    parameters: {},
  };

  // Map action types to n8n node types
  switch (action?.type) {
    case "send_email":
      return {
        ...baseNode,
        type: "n8n-nodes-base.gmail",
        name: "Send Email",
        parameters: {
          operation: "send",
          to: action.parameters?.to || "",
          subject: action.parameters?.subject || "",
          message: action.parameters?.body || "",
        },
        credentials: {
          gmailOAuth2: {
            id: action.service || "gmail",
            name: "Gmail account",
          },
        },
      };

    case "send_message":
      return {
        ...baseNode,
        type: "n8n-nodes-base.slack",
        name: "Send Slack Message",
        parameters: {
          channel: action.parameters?.channel || "#general",
          text: action.parameters?.text || "",
        },
        credentials: {
          slackApi: {
            id: action.service || "slack",
            name: "Slack account",
          },
        },
      };

    case "save_data":
    case "update_data":
      return {
        ...baseNode,
        type: "n8n-nodes-base.set",
        name: action.type === "save_data" ? "Save Data" : "Update Data",
        parameters: {
          values: {
            string: Object.entries(action.parameters || {}).map(([key, value]) => ({
              name: key,
              value: String(value),
            })),
          },
        },
      };

    case "generic_action":
    default:
      return {
        ...baseNode,
        type: "n8n-nodes-base.code",
        name: "Execute Action",
        parameters: {
          jsCode: `// Action: ${action.type}\n// Service: ${action.service || "none"}\n// Operation: ${action.operation || "none"}\nreturn items;`,
        },
      };
  }
}

