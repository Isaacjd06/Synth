// lib/workflow/builder.ts

import { WorkflowPlan } from "./types";

/**
 * Types representing the subset of n8n workflow JSON we care about.
 */

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
}

export interface N8nConnectionItem {
  node: string;
  type: string;
  index: number;
}

export interface N8nConnections {
  [sourceNodeName: string]: {
    main: N8nConnectionItem[][];
  };
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Helper to create incremental string IDs for n8n nodes.
 */
function createNodeId(index: number): string {
  return String(index);
}

/**
 * Convert our simple {{source.field}} placeholders into n8n expressions:
 *
 *   {{normalize_payload.normalized}}  ->  ={{ $node["normalize_payload"].json["normalized"] }}
 *   {{webhook.body}}                 ->  ={{ $node["Trigger"].json }}
 *
 * For now we assume the entire string is the placeholder.
 */
function convertExpressionString(
  value: string,
  actionIdToNodeName: Map<string, string>,
  triggerNodeName: string
): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{{") || !trimmed.endsWith("}}")) {
    return value;
  }

  const inner = trimmed.slice(2, -2).trim(); // remove {{ }}
  const [source, ...fieldParts] = inner.split(".");

  // If we don't even have a source, bail out
  if (!source) {
    return value;
  }

  // Handle webhook as special alias for trigger node
  const nodeName =
    source === "webhook"
      ? triggerNodeName
      : actionIdToNodeName.get(source) ?? source;

  // If no field parts, just reference the node's JSON
  if (fieldParts.length === 0) {
    return `={{ $node["${nodeName}"].json }}`;
  }

  // For {{webhook.body}} we usually want the entire JSON,
  // since the body is the main payload. We'll special-case that.
  if (source === "webhook" && fieldParts.length === 1 && fieldParts[0] === "body") {
    return `={{ $node["${nodeName}"].json }}`;
  }

  const jsonPath = fieldParts
    .filter(Boolean)
    .map((part) => `["${part}"]`)
    .join("");

  if (!jsonPath) {
    return `={{ $node["${nodeName}"].json }}`;
  }

  return `={{ $node["${nodeName}"].json${jsonPath} }}`;
}

/**
 * Recursively walk a value and convert any expression strings.
 */
function convertExpressionsDeep(
  value: unknown,
  actionIdToNodeName: Map<string, string>,
  triggerNodeName: string
): unknown {
  if (typeof value === "string") {
    return convertExpressionString(value, actionIdToNodeName, triggerNodeName);
  }

  if (Array.isArray(value)) {
    return value.map((v) =>
      convertExpressionsDeep(v, actionIdToNodeName, triggerNodeName)
    );
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = convertExpressionsDeep(v, actionIdToNodeName, triggerNodeName);
    }
    return result;
  }

  return value;
}

/**
 * Build n8n node parameters for each trigger/action type.
 * For now, we map our params directly into n8n parameters and keep it simple,
 * but with expression support for a good UX.
 */
function buildTriggerNode(
  trigger: WorkflowPlan["trigger"],
  nodeId: string,
  position: [number, number]
): N8nNode {
  switch (trigger.type) {
    case "webhook":
      return {
        id: nodeId,
        name: "Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position,
        parameters: {
          path: trigger.config.path,
          httpMethod: (trigger.config.method || "POST").toUpperCase(),
          // You can extend with responseMode, responseData, etc. later
        },
      };

    case "cron":
      return {
        id: nodeId,
        name: "Trigger",
        type: "n8n-nodes-base.cron",
        typeVersion: 1,
        position,
        parameters: {
          // NOTE: This is a simplified representation; you may need to
          // adapt this to match n8n's exact cron node structure later.
          cronExpression: trigger.config.cronExpression,
          interval: trigger.config.interval,
        },
      };

    case "manual":
    default:
      return {
        id: nodeId,
        name: "Trigger",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position,
        parameters: {},
      };
  }
}

function buildActionNode(
  action: WorkflowPlan["actions"][number],
  nodeId: string,
  position: [number, number],
  triggerNodeName: string,
  actionIdToNodeName: Map<string, string>
): N8nNode {
  // Map our action types to n8n node types
  let n8nType: string;
  switch (action.type) {
    case "http_request":
      n8nType = "n8n-nodes-base.httpRequest";
      break;
    case "set_data":
      n8nType = "n8n-nodes-base.set";
      break;
    case "send_email":
      n8nType = "n8n-nodes-base.emailSend";
      break;
    case "delay":
      n8nType = "n8n-nodes-base.wait";
      break;
    default:
      // Fallback: treat as generic HTTP request node (or you can throw).
      n8nType = "n8n-nodes-base.httpRequest";
  }

  // Convert any expressions present in our params
  const convertedParams = convertExpressionsDeep(
    action.params,
    actionIdToNodeName,
    triggerNodeName
  );

  return {
    id: nodeId,
    name: action.id, // for now use the action id as node name (clean + predictable)
    type: n8nType,
    typeVersion: 1,
    position,
    parameters: convertedParams,
  };
}

/**
 * Build the connections object based on onSuccessNext / onFailureNext.
 * For now we only wire the "main" output, and treat all edges the same.
 */
function buildConnections(
  nodes: N8nNode[],
  plan: WorkflowPlan
): N8nConnections {
  const connections: N8nConnections = {};

  // Helper to ensure the structure exists
  function ensureMainArray(nodeName: string) {
    if (!connections[nodeName]) {
      connections[nodeName] = { main: [[]] };
    } else if (!connections[nodeName].main) {
      connections[nodeName].main = [[]];
    }
  }

  // Build lookup from action id => node name for wiring
  const actionIdToNodeName = new Map<string, string>();
  for (const node of nodes) {
    // Skip trigger; action IDs are not "Trigger"
    if (node.name !== "Trigger") {
      actionIdToNodeName.set(node.name, node.name);
    }
  }

  // Create connections between action nodes
  for (const action of plan.actions) {
    const sourceNodeName = action.id;
    ensureMainArray(sourceNodeName);

    // Success paths
    for (const nextId of action.onSuccessNext || []) {
      const targetNodeName = actionIdToNodeName.get(nextId);
      if (!targetNodeName) continue;

      connections[sourceNodeName].main[0].push({
        node: targetNodeName,
        type: "main",
        index: 0,
      });
    }

    // Failure paths (for now, we treat them the same way on "main")
    for (const nextId of action.onFailureNext || []) {
      const targetNodeName = actionIdToNodeName.get(nextId);
      if (!targetNodeName) continue;

      connections[sourceNodeName].main[0].push({
        node: targetNodeName,
        type: "main",
        index: 0,
      });
    }
  }

  // Connect Trigger → starting actions
  // Starting actions = those with no predecessors (enforced in validator).
  const incomingCounts: Record<string, number> = {};
  for (const action of plan.actions) {
    incomingCounts[action.id] = 0;
  }
  for (const action of plan.actions) {
    for (const nextId of action.onSuccessNext || []) {
      incomingCounts[nextId] += 1;
    }
    for (const nextId of action.onFailureNext || []) {
      incomingCounts[nextId] += 1;
    }
  }

  const startingActions = plan.actions.filter(
    (a) => incomingCounts[a.id] === 0
  );

  if (startingActions.length > 0) {
    ensureMainArray("Trigger");
    for (const startAction of startingActions) {
      connections["Trigger"].main[0].push({
        node: startAction.id,
        type: "main",
        index: 0,
      });
    }
  }

  return connections;
}

/**
 * FUTURE: Build n8n workflow JSON from WorkflowPlan
 * 
 * ⚠️ NOT USED IN MVP ⚠️
 * 
 * This function is kept for future n8n support. During MVP, Synth uses ONLY Pipedream
 * as the execution engine. WorkflowPlan is already engine-agnostic and can be sent
 * directly to Pipedream without n8n-specific conversion.
 * 
 * For MVP, use: lib/pipedream/deployWorkflow.ts which accepts WorkflowPlan directly
 * 
 * See: knowledge/architecture/n8n-logic.md
 */
export function buildN8nWorkflowFromPlan(plan: WorkflowPlan): N8nWorkflow {
  const nodes: N8nNode[] = [];

  // Trigger node (id "1")
  const triggerNodeId = createNodeId(1);
  const triggerNodeName = "Trigger";
  const triggerNode = buildTriggerNode(plan.trigger, triggerNodeId, [0, 0]);
  nodes.push(triggerNode);

  // Map for action id => node name (we use action.id as node name)
  const actionIdToNodeName = new Map<string, string>();

  // Action nodes
  let nodeIndex = 2;
  const verticalOffset = 200;

  plan.actions.forEach((action, index) => {
    const nodeId = createNodeId(nodeIndex++);
    const position: [number, number] = [index * 280 + 200, verticalOffset];

    const node = buildActionNode(
      action,
      nodeId,
      position,
      triggerNodeName,
      actionIdToNodeName
    );

    nodes.push(node);
    actionIdToNodeName.set(action.id, node.name);
  });

  // Build connections
  const connections = buildConnections(nodes, plan);

  const workflow: N8nWorkflow = {
    name: plan.name,
    nodes,
    connections,
    settings: {},
    tags: [],
  };

  return workflow;
}
