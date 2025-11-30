// lib/workflow/types.ts

/**
 * ============================================================
 * TRIGGER DEFINITIONS (strict)
 * ============================================================
 */

export type WebhookTriggerDefinition = {
    type: "webhook";
    config: {
      path: string;
      method?: string; // default POST if omitted
    };
  };
  
  export type CronInterval = {
    amount: number;
    unit: "seconds" | "minutes" | "hours" | "days";
  };
  
  export type CronTriggerDefinition = {
    type: "cron";
    config: {
      cronExpression?: string; // e.g. "0 0 * * *"
      interval?: CronInterval; // alternative to cronExpression
    };
  };
  
  export type ManualTriggerDefinition = {
    type: "manual";
    config?: Record<string, any>;
  };
  
  export type TriggerDefinition =
    | WebhookTriggerDefinition
    | CronTriggerDefinition
    | ManualTriggerDefinition;
  
  /**
   * ============================================================
   * ACTION DEFINITIONS (strict, safe)
   * ============================================================
   *
   * These represent the only action types Synth supports for now.
   * They map 1:1 to allowed node types in n8n.
   *
   * You picked Option 1 → strict node types.
   * This is the safest and most scalable structure.
   */
  
  /**
   * HTTP Request Action
   */
  export type HttpRequestAction = {
    id: string;
    type: "http_request";
    params: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      query?: Record<string, string>;
      body?: any;
      authRef?: string; // optional pointer to a connection in your DB
    };
    onSuccessNext: string[];
    onFailureNext?: string[];
  };
  
  /**
   * Set Data Action
   */
  export type SetDataAction = {
    id: string;
    type: "set_data";
    params: {
      fields: Record<string, any>;
    };
    onSuccessNext: string[];
    onFailureNext?: string[];
  };
  
  /**
   * Send Email Action
   */
  export type SendEmailAction = {
    id: string;
    type: "send_email";
    params: {
      to: string;
      subject: string;
      body: string;
      from?: string;
    };
    onSuccessNext: string[];
    onFailureNext?: string[];
  };
  
  /**
   * Delay Action
   */
  export type DelayAction = {
    id: string;
    type: "delay";
    params: {
      durationMs?: number;
      structured?: {
        amount: number;
        unit: "seconds" | "minutes" | "hours";
      };
    };
    onSuccessNext: string[];
    onFailureNext?: string[];
  };
  
  /**
   * Union type of all allowed action types
   */
  export type ActionDefinition =
    | HttpRequestAction
    | SetDataAction
    | SendEmailAction
    | DelayAction;
  
  /**
   * ============================================================
   * WORKFLOW PLAN (Produced by Brain, Templates, etc)
   * ============================================================
   *
   * This is the structure the Brain and Templates output and the
   * validator/builder consume.
   *
   * It represents a Synth workflow in a portable format.
   */
  
  export type WorkflowPlan = {
    name: string;
    description?: string;
    intent?: string;
    trigger: TriggerDefinition;
    actions: ActionDefinition[];
    metadata?: Record<string, any>;
  };
  
  /**
   * ============================================================
   * TEMPLATE DEFINITIONS (static templates)
   * ============================================================
   */
  
  export type WorkflowTemplateInputField = {
    key: string;
    label: string;
    type: string; // "string" | "email" | "url" | "mapping" | "interval" | etc.
    description?: string;
  };
  
  export type WorkflowTemplate = {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredInputs: WorkflowTemplateInputField[];
    buildPlan: (inputs: Record<string, any>) => WorkflowPlan;
  };
  