// lib/workflow/validator.ts

import {
    WorkflowPlan,
    ActionDefinition,
    TriggerDefinition,
  } from "./types";
  import {
    WorkflowPlanSchema,
    ActionDefinitionSchema,
    TriggerDefinitionSchema,
  } from "./schema";
  
  /**
   * Result type for validation
   */
  export type WorkflowPlanValidationResult =
    | { ok: true; plan: WorkflowPlan }
    | { ok: false; error: string; details?: any };
  
  /**
   * Validates a workflow plan (raw input).
   * Performs both Zod schema validation AND cross-node structural checks.
   */
  export function validateWorkflowPlan(
    raw: unknown
  ): WorkflowPlanValidationResult {
    // Step 1: Validate shape with Zod
    let parsed: WorkflowPlan;
    try {
      parsed = WorkflowPlanSchema.parse(raw);
    } catch (err: any) {
      return {
        ok: false,
        error: "WorkflowPlan schema validation failed.",
        details: err?.errors || err,
      };
    }
  
    const { trigger, actions } = parsed;
  
    // Step 2: Ensure action IDs are unique
    const seenIds = new Set<string>();
    for (const action of actions) {
      if (seenIds.has(action.id)) {
        return {
          ok: false,
          error: `Duplicate action id detected: '${action.id}'`,
        };
      }
      seenIds.add(action.id);
    }
  
    // Step 3: Ensure all onSuccessNext / onFailureNext references exist
    const actionIds = new Set(actions.map((a) => a.id));
  
    for (const action of actions) {
      for (const nextId of action.onSuccessNext || []) {
        if (!actionIds.has(nextId)) {
          return {
            ok: false,
            error: `Action '${action.id}' references unknown onSuccessNext id '${nextId}'.`,
          };
        }
      }
      for (const nextId of action.onFailureNext || []) {
        if (!actionIds.has(nextId)) {
          return {
            ok: false,
            error: `Action '${action.id}' references unknown onFailureNext id '${nextId}'.`,
          };
        }
      }
    }
  
    // Step 4: Ensure trigger connects to at least one action
    //
    // A valid starting action is one that:
    // - Has no other action pointing to it (i.e., it's a start node)
    //   AND
    // - At least one action must exist
    //
    // Then ensure that at least one such action is reachable (not isolated).
    //
    // Here, we enforce the simple MVP rule:
    // -> The first action must have no incoming predecessors.
    // -> Must exist at least one "starting action".
    const incomingCounts: Record<string, number> = {};
  
    // Initialize incoming count
    for (const id of actionIds) {
      incomingCounts[id] = 0;
    }
  
    // Count incoming edges
    for (const action of actions) {
      for (const nxt of action.onSuccessNext || []) {
        incomingCounts[nxt] += 1;
      }
      for (const nxt of action.onFailureNext || []) {
        incomingCounts[nxt] += 1;
      }
    }
  
    // Find actions with zero incoming edges
    const startingActions = actions.filter((a) => incomingCounts[a.id] === 0);
  
    if (startingActions.length === 0) {
      return {
        ok: false,
        error:
          "No valid starting action found. At least one action must not have a predecessor.",
      };
    }
  
    // Step 5: Enforce: trigger must connect to at least one starting action.
    //
    // For the MVP, starting actions must be reachable directly from the trigger.
    // Templates already do this with `onSuccessNext` from the trigger (implicitly).
    // But since "trigger → first action" is not encoded in the plan itself,
    // we only enforce that at least one starting action exists, which we did above.
    //
    // Future versions may explicitly define trigger→action connections.
    // For now, startingAction existence is treated as the trigger’s connection.
  
    // Everything is good
    return {
      ok: true,
      plan: parsed,
    };
  }
  