// lib/workflow/templates.ts

import { WorkflowPlan, WorkflowTemplate } from "./types";

type TemplateInputs = Record<string, any>;

// Small helper to normalize webhook paths from slugs
function buildWebhookPath(slug: string): string {
  const trimmed = slug.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return `/synth/${trimmed}`;
}

/**
 * Template 1: Webhook → Set → HTTP Request
 * Use case: intake webhook, normalize data, forward to an external API.
 *
 * Required inputs:
 * - webhookPath: string (slug, e.g. "lead-intake")
 * - targetUrl: string
 * Optional:
 * - requestMethod: string
 * - mapping: Record<string, any>
 */
const webhookSetHttpTemplate: WorkflowTemplate = {
  id: "webhook_set_http",
  name: "Webhook → Set → HTTP request",
  description:
    "Receive data via webhook, normalize it, and forward it to an external HTTP endpoint.",
  category: "intake-forwarding",
  requiredInputs: [
    {
      key: "webhookPath",
      label: "Webhook path slug",
      type: "string",
      description:
        "Slug for the webhook path, e.g. 'lead-intake'. The full path will be /synth/<slug>.",
    },
    {
      key: "targetUrl",
      label: "Target URL",
      type: "url",
      description: "The HTTP endpoint to forward normalized data to.",
    },
    {
      key: "requestMethod",
      label: "HTTP method",
      type: "string",
      description: "Optional HTTP method for the request (default POST).",
    },
    {
      key: "mapping",
      label: "Field mapping",
      type: "mapping",
      description:
        "Optional mapping from incoming fields to normalized fields (e.g. { email: 'body.email' }).",
    },
  ],
  buildPlan(inputs: TemplateInputs): WorkflowPlan {
    const webhookSlug = String(inputs.webhookPath || "").trim();
    const targetUrl = String(inputs.targetUrl || "").trim();
    const requestMethod =
      (inputs.requestMethod as string | undefined)?.toUpperCase() || "POST";

    const plan: WorkflowPlan = {
      name: "Webhook → Set → HTTP request",
      description:
        "Receives data via webhook, normalizes the payload, and forwards it to an external HTTP endpoint.",
      intent: "intake_forward_to_http",
      trigger: {
        type: "webhook",
        config: {
          path: buildWebhookPath(webhookSlug),
          method: "POST",
        },
      },
      actions: [
        {
          id: "normalize_payload",
          type: "set_data",
          params: {
            // For now, we just pass through the entire incoming body.
            // Later, this can use `inputs.mapping` to reshape the data.
            fields: {
              normalized: "{{webhook.body}}",
              mapping: inputs.mapping || null,
            },
          },
          onSuccessNext: ["forward_request"],
        },
        {
          id: "forward_request",
          type: "http_request",
          params: {
            url: targetUrl,
            method: requestMethod,
            // In a real system, you'd reference normalized data via expressions.
            body: "{{normalize_payload.normalized}}",
          },
          onSuccessNext: [],
        },
      ],
      metadata: {
        templateId: "webhook_set_http",
        rawInputs: inputs,
      },
    };

    return plan;
  },
};

/**
 * Template 2: Webhook → Email
 * Use case: notify via email when a webhook receives new data.
 *
 * Required inputs:
 * - webhookPath: string (slug)
 * - emailTo: string
 * Optional:
 * - subjectTemplate: string
 * - bodyTemplate: string
 */
const webhookEmailTemplate: WorkflowTemplate = {
  id: "webhook_email",
  name: "Webhook → Email",
  description:
    "Receive data via webhook and send an email notification with the details.",
  category: "notifications",
  requiredInputs: [
    {
      key: "webhookPath",
      label: "Webhook path slug",
      type: "string",
      description:
        "Slug for the webhook path, e.g. 'new-lead'. The full path will be /synth/<slug>.",
    },
    {
      key: "emailTo",
      label: "Recipient email",
      type: "email",
      description: "Email address that will receive the notification.",
    },
    {
      key: "subjectTemplate",
      label: "Email subject template",
      type: "string",
      description:
        "Optional subject template. If omitted, a default subject will be used.",
    },
    {
      key: "bodyTemplate",
      label: "Email body template",
      type: "string",
      description:
        "Optional body template. If omitted, a JSON dump of the payload will be used.",
    },
  ],
  buildPlan(inputs: TemplateInputs): WorkflowPlan {
    const webhookSlug = String(inputs.webhookPath || "").trim();
    const emailTo = String(inputs.emailTo || "").trim();
    const subjectTemplate =
      (inputs.subjectTemplate as string | undefined) ||
      "New webhook event received";
    const bodyTemplate =
      (inputs.bodyTemplate as string | undefined) ||
      "A new event was received:\n\n{{webhook.body}}";

    const plan: WorkflowPlan = {
      name: "Webhook → Email",
      description:
        "Receives data via webhook and sends an email notification containing the payload.",
      intent: "intake_notify_email",
      trigger: {
        type: "webhook",
        config: {
          path: buildWebhookPath(webhookSlug),
          method: "POST",
        },
      },
      actions: [
        {
          id: "build_email_body",
          type: "set_data",
          params: {
            fields: {
              subject: subjectTemplate,
              body: bodyTemplate,
              rawPayload: "{{webhook.body}}",
            },
          },
          onSuccessNext: ["send_email"],
        },
        {
          id: "send_email",
          type: "send_email",
          params: {
            to: emailTo,
            subject: "{{build_email_body.subject}}",
            body: "{{build_email_body.body}}",
          },
          onSuccessNext: [],
        },
      ],
      metadata: {
        templateId: "webhook_email",
        rawInputs: inputs,
      },
    };

    return plan;
  },
};

/**
 * Template 3: Cron → HTTP → Email
 * Use case: scheduled report via HTTP request, emailed to user.
 *
 * Required inputs:
 * - requestUrl: string
 * - emailTo: string
 * Optional:
 * - cronExpression: string
 * - interval: { amount: number; unit: "seconds" | "minutes" | "hours" | "days" }
 * - emailSubject: string
 */
const cronHttpEmailTemplate: WorkflowTemplate = {
  id: "cron_http_email",
  name: "Cron → HTTP request → Email",
  description:
    "Run on a schedule, fetch data via HTTP, and email the results to a recipient.",
  category: "reporting",
  requiredInputs: [
    {
      key: "requestUrl",
      label: "Request URL",
      type: "url",
      description: "HTTP endpoint to call on the schedule.",
    },
    {
      key: "emailTo",
      label: "Recipient email",
      type: "email",
      description: "Email address that will receive the report.",
    },
    {
      key: "cronExpression",
      label: "Cron expression",
      type: "string",
      description:
        "Optional cron expression for scheduling. If omitted, an interval can be used.",
    },
    {
      key: "interval",
      label: "Interval",
      type: "interval",
      description:
        "Optional structured interval (amount + unit). Used when cronExpression is not provided.",
    },
    {
      key: "emailSubject",
      label: "Email subject",
      type: "string",
      description:
        "Optional email subject. Defaults to 'Scheduled report from Synth'.",
    },
  ],
  buildPlan(inputs: TemplateInputs): WorkflowPlan {
    const requestUrl = String(inputs.requestUrl || "").trim();
    const emailTo = String(inputs.emailTo || "").trim();
    const cronExpression =
      (inputs.cronExpression as string | undefined)?.trim() || undefined;
    const interval = inputs.interval as
      | { amount: number; unit: "seconds" | "minutes" | "hours" | "days" }
      | undefined;
    const emailSubject =
      (inputs.emailSubject as string | undefined) ||
      "Scheduled report from Synth";

    const plan: WorkflowPlan = {
      name: "Cron → HTTP request → Email",
      description:
        "Runs on a schedule, fetches data from an HTTP endpoint, and emails the results.",
      intent: "scheduled_http_report",
      trigger: {
        type: "cron",
        config: {
          cronExpression,
          interval,
        },
      },
      actions: [
        {
          id: "fetch_data",
          type: "http_request",
          params: {
            url: requestUrl,
            method: "GET",
          },
          onSuccessNext: ["format_email"],
        },
        {
          id: "format_email",
          type: "set_data",
          params: {
            fields: {
              subject: emailSubject,
              body:
                "Here is your scheduled report:\n\n{{fetch_data.response}}",
            },
          },
          onSuccessNext: ["send_email"],
        },
        {
          id: "send_email",
          type: "send_email",
          params: {
            to: emailTo,
            subject: "{{format_email.subject}}",
            body: "{{format_email.body}}",
          },
          onSuccessNext: [],
        },
      ],
      metadata: {
        templateId: "cron_http_email",
        rawInputs: inputs,
      },
    };

    return plan;
  },
};

/**
 * Template 4: Webhook → Set → Delay → HTTP
 * Use case: delayed follow-up via HTTP request.
 *
 * Required inputs:
 * - webhookPath: string (slug)
 * - delayMs OR interval: { amount, unit }
 * - targetUrl: string
 */
const webhookDelayHttpTemplate: WorkflowTemplate = {
  id: "webhook_delay_http",
  name: "Webhook → Delay → HTTP request",
  description:
    "Receive data via webhook, optionally normalize it, wait for a delay, then call an HTTP endpoint.",
  category: "follow-ups",
  requiredInputs: [
    {
      key: "webhookPath",
      label: "Webhook path slug",
      type: "string",
      description:
        "Slug for the webhook path, e.g. 'follow-up'. The full path will be /synth/<slug>.",
    },
    {
      key: "targetUrl",
      label: "Target URL",
      type: "url",
      description: "The HTTP endpoint to call after the delay.",
    },
    {
      key: "delayMs",
      label: "Delay (ms)",
      type: "number",
      description:
        "Optional delay in milliseconds. If omitted, `interval` can be used instead.",
    },
    {
      key: "interval",
      label: "Delay interval",
      type: "interval",
      description:
        "Optional structured delay (amount + unit). Used if delayMs is not set.",
    },
  ],
  buildPlan(inputs: TemplateInputs): WorkflowPlan {
    const webhookSlug = String(inputs.webhookPath || "").trim();
    const targetUrl = String(inputs.targetUrl || "").trim();
    const delayMs =
      typeof inputs.delayMs === "number" ? (inputs.delayMs as number) : undefined;
    const interval = inputs.interval as
      | { amount: number; unit: "seconds" | "minutes" | "hours" }
      | undefined;

    const plan: WorkflowPlan = {
      name: "Webhook → Delay → HTTP request",
      description:
        "Receives data via webhook, waits for a delay, and then calls an HTTP endpoint.",
      intent: "delayed_http_followup",
      trigger: {
        type: "webhook",
        config: {
          path: buildWebhookPath(webhookSlug),
          method: "POST",
        },
      },
      actions: [
        {
          id: "prepare_payload",
          type: "set_data",
          params: {
            fields: {
              payload: "{{webhook.body}}",
            },
          },
          onSuccessNext: ["delay_step"],
        },
        {
          id: "delay_step",
          type: "delay",
          params: {
            durationMs: delayMs,
            structured: interval,
          },
          onSuccessNext: ["send_request"],
        },
        {
          id: "send_request",
          type: "http_request",
          params: {
            url: targetUrl,
            method: "POST",
            body: "{{prepare_payload.payload}}",
          },
          onSuccessNext: [],
        },
      ],
      metadata: {
        templateId: "webhook_delay_http",
        rawInputs: inputs,
      },
    };

    return plan;
  },
};

export const templates: Record<string, WorkflowTemplate> = {
  webhook_set_http: webhookSetHttpTemplate,
  webhook_email: webhookEmailTemplate,
  cron_http_email: cronHttpEmailTemplate,
  webhook_delay_http: webhookDelayHttpTemplate,
};
