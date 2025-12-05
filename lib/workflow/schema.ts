// lib/workflow/schema.ts

import { z } from "zod";
import {
  TriggerDefinition,
  ActionDefinition,
  WorkflowPlan,
} from "./types";

/**
 * Helpers
 */

// "Loose" URL validator: require a non-empty string that starts with http:// or https://
// and has no spaces. Allows localhost and dev URLs.
const looseUrlSchema = z
  .string()
  .min(1, "URL cannot be empty")
  .refine(
    (val) =>
      (val.startsWith("http://") || val.startsWith("https://")) &&
      !/\s/.test(val),
    {
      message: "URL must start with http:// or https:// and contain no spaces",
    }
  );

// Interval schema reused in cron + delay
const intervalSchema = z.object({
  amount: z
    .number()
    .positive("Interval amount must be a positive number"),
  unit: z.enum(["seconds", "minutes", "hours", "days"]),
});

/**
 * Trigger schemas
 */

const webhookTriggerSchema = z.object({
  type: z.literal("webhook"),
  config: z.object({
    path: z
      .string()
      .min(1, "Webhook path cannot be empty"),
    method: z
      .string()
      .optional(), // n8n is flexible; we validate later if needed
  }),
});

const cronTriggerSchemaBase = z.object({
  type: z.literal("cron"),
  config: z.object({
    cronExpression: z.string().optional(),
    interval: intervalSchema.optional(),
  }),
});

// Ensure at least one of cronExpression or interval is provided
const cronTriggerSchema = cronTriggerSchemaBase.superRefine(
  (value, ctx) => {
    const { cronExpression, interval } = value.config;
    if (!cronExpression && !interval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Cron trigger requires either cronExpression or interval.",
        path: ["config"],
      });
    }
  }
);

const manualTriggerSchema = z.object({
  type: z.literal("manual"),
  config: z
    .object({})
    .optional(),
});

export const TriggerDefinitionSchema = z.discriminatedUnion("type", [
  webhookTriggerSchema,
  cronTriggerSchema,
  manualTriggerSchema,
]);

export type TriggerDefinitionInput = z.infer<typeof TriggerDefinitionSchema>;

/**
 * Action schemas
 */

// HTTP Request action
const httpRequestActionSchema = z.object({
  id: z
    .string()
    .min(1, "Action id cannot be empty"),
  type: z.literal("http_request"),
  params: z.object({
    url: looseUrlSchema,
    method: z
      .string()
      .optional(), // we'll allow any method string, keep it flexible
    headers: z
      .record(z.string(), z.string())
      .optional(),
    query: z
      .record(z.string(), z.string())
      .optional(),
    body: z.unknown().optional(),
    authRef: z.string().optional(),
  }),
  onSuccessNext: z
    .array(z.string())
    .default([]),
  onFailureNext: z
    .array(z.string())
    .optional(),
});

// Set Data action
const setDataActionSchema = z.object({
  id: z
    .string()
    .min(1, "Action id cannot be empty"),
  type: z.literal("set_data"),
  params: z.object({
    fields: z.record(z.string(), z.unknown()),
  }),
  onSuccessNext: z
    .array(z.string())
    .default([]),
  onFailureNext: z
    .array(z.string())
    .optional(),
});

// Send Email action
const sendEmailActionSchema = z.object({
  id: z
    .string()
    .min(1, "Action id cannot be empty"),
  type: z.literal("send_email"),
  params: z.object({
    to: z
      .string()
      .min(1, "Recipient email cannot be empty"),
    subject: z
      .string()
      .min(1, "Email subject cannot be empty"),
    body: z
      .string()
      .min(1, "Email body cannot be empty"),
    from: z.string().optional(),
  }),
  onSuccessNext: z
    .array(z.string())
    .default([]),
  onFailureNext: z
    .array(z.string())
    .optional(),
});

// Delay action
const delayActionSchemaBase = z.object({
  id: z
    .string()
    .min(1, "Action id cannot be empty"),
  type: z.literal("delay"),
  params: z.object({
    durationMs: z
      .number()
      .positive("durationMs must be a positive number")
      .optional(),
    structured: z
      .object({
        amount: z
          .number()
          .positive("Delay amount must be a positive number"),
        unit: z.enum(["seconds", "minutes", "hours"]),
      })
      .optional(),
  }),
  onSuccessNext: z
    .array(z.string())
    .default([]),
  onFailureNext: z
    .array(z.string())
    .optional(),
});

// Ensure at least one of durationMs or structured is provided
const delayActionSchema = delayActionSchemaBase.superRefine(
  (value, ctx) => {
    const { durationMs, structured } = value.params;
    if (durationMs == null && !structured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Delay action requires either durationMs or structured interval.",
        path: ["params"],
      });
    }
  }
);

export const ActionDefinitionSchema = z.discriminatedUnion("type", [
  httpRequestActionSchema,
  setDataActionSchema,
  sendEmailActionSchema,
  delayActionSchema,
]);

export type ActionDefinitionInput = z.infer<typeof ActionDefinitionSchema>;

/**
 * WorkflowPlan schema
 */

export const WorkflowPlanSchema = z.object({
  name: z
    .string()
    .min(1, "Workflow name cannot be empty"),
  description: z.string().optional(),
  intent: z.string().optional(),
  trigger: TriggerDefinitionSchema,
  actions: z
    .array(ActionDefinitionSchema)
    .min(1, "Workflow must have at least one action"),
  metadata: z
    .record(z.string(), z.unknown())
    .optional(),
});

// Type helpers that align with your existing TS types
export type WorkflowPlanInput = z.infer<typeof WorkflowPlanSchema>;

// Utility functions for parsing/validating raw input
export function parseTriggerDefinition(
  raw: unknown
): TriggerDefinition {
  return TriggerDefinitionSchema.parse(raw) as TriggerDefinition;
}

export function parseActionDefinition(
  raw: unknown
): ActionDefinition {
  return ActionDefinitionSchema.parse(raw) as ActionDefinition;
}

export function parseWorkflowPlan(
  raw: unknown
): WorkflowPlan {
  return WorkflowPlanSchema.parse(raw) as WorkflowPlan;
}
