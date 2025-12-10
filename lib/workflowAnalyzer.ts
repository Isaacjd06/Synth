/**
 * Workflow Analyzer
 * 
 * Analyzes chat messages and extracts normalized workflow structures.
 * Uses pattern detection for now, will be replaced with LLM integration later.
 */

export interface WorkflowTrigger {
  type: 'webhook' | 'schedule' | 'manual' | 'event';
  source?: string;
  condition?: string;
}

export interface WorkflowAction {
  type: string;
  service?: string;
  operation?: string;
  parameters?: Record<string, unknown>;
}

export interface NormalizedWorkflow {
  intent: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
}

/**
 * Analyzes a chat message and extracts workflow information
 * @param message - The chat message to analyze
 * @returns A normalized workflow structure
 */
export function analyzeWorkflowFromMessage(message: string): NormalizedWorkflow {
  const normalized = message.toLowerCase().trim();
  
  // Pattern detection for common workflow intents
  const intent = detectIntent(normalized);
  const trigger = detectTrigger(normalized);
  const actions = detectActions(normalized);
  
  // Generate name and description based on detected patterns
  const name = generateWorkflowName(intent, trigger, actions);
  const description = generateDescription(intent, trigger, actions);
  
  // Validate and return normalized structure
  return validateAndNormalize({
    intent,
    name,
    description,
    trigger,
    actions,
  });
}

/**
 * Detects the intent from the message
 */
function detectIntent(message: string): string {
  // Common workflow intents
  if (message.includes('when') || message.includes('if')) {
    if (message.includes('email') || message.includes('gmail')) {
      return 'email_automation';
    }
    if (message.includes('slack') || message.includes('message')) {
      return 'notification';
    }
    if (message.includes('schedule') || message.includes('daily') || message.includes('weekly')) {
      return 'scheduled_task';
    }
    return 'event_triggered';
  }
  
  if (message.includes('automate') || message.includes('automatic')) {
    return 'automation';
  }
  
  if (message.includes('send') || message.includes('notify')) {
    return 'notification';
  }
  
  if (message.includes('sync') || message.includes('sync')) {
    return 'data_sync';
  }
  
  // Default intent
  return 'general_workflow';
}

/**
 * Detects the trigger from the message
 */
function detectTrigger(message: string): WorkflowTrigger {
  // Schedule triggers
  if (message.includes('every') || message.includes('daily') || message.includes('weekly') || 
      message.includes('hourly') || message.includes('schedule')) {
    return {
      type: 'schedule',
      condition: extractScheduleCondition(message),
    };
  }
  
  // Webhook/event triggers
  if (message.includes('when') || message.includes('if')) {
    // Note: extractTriggerSource is now async but this function is sync
    // For now, use a simple keyword-based approach
    const normalizedMessage = message.toLowerCase();
    let source: string | undefined;
    
    if (normalizedMessage.includes('webhook') || normalizedMessage.includes('http')) source = 'webhook';
    else if (normalizedMessage.includes('email') || normalizedMessage.includes('gmail')) source = 'email';
    else if (normalizedMessage.includes('slack')) source = 'slack';
    else if (normalizedMessage.includes('github')) source = 'github';
    else if (normalizedMessage.includes('form')) source = 'form';
    
    return {
      type: 'event',
      source: source || 'unknown',
      condition: extractCondition(message),
    };
  }
  
  // Manual trigger (default)
  return {
    type: 'manual',
  };
}

/**
 * Detects actions from the message
 */
function detectActions(message: string): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  
  // Email actions
  if (message.includes('send email') || message.includes('email')) {
    actions.push({
      type: 'send_email',
      service: 'gmail',
      operation: 'send',
      parameters: extractEmailParameters(message),
    });
  }
  
  // Slack actions
  if (message.includes('slack') || message.includes('send message')) {
    actions.push({
      type: 'send_message',
      service: 'slack',
      operation: 'post_message',
      parameters: extractMessageParameters(message),
    });
  }
  
  // Data operations
  if (message.includes('save') || message.includes('store')) {
    actions.push({
      type: 'save_data',
      operation: 'create',
      parameters: {},
    });
  }
  
  if (message.includes('update') || message.includes('modify')) {
    actions.push({
      type: 'update_data',
      operation: 'update',
      parameters: {},
    });
  }
  
  // Default action if none detected
  if (actions.length === 0) {
    actions.push({
      type: 'generic_action',
      operation: 'execute',
      parameters: {},
    });
  }
  
  return actions;
}

/**
 * Extracts schedule condition from message
 */
function extractScheduleCondition(message: string): string {
  if (message.includes('every hour') || message.includes('hourly')) {
    return '0 * * * *'; // Every hour
  }
  if (message.includes('every day') || message.includes('daily')) {
    return '0 0 * * *'; // Daily at midnight
  }
  if (message.includes('every week') || message.includes('weekly')) {
    return '0 0 * * 0'; // Weekly on Sunday
  }
  if (message.includes('every month') || message.includes('monthly')) {
    return '0 0 1 * *'; // Monthly on 1st
  }
  return '0 0 * * *'; // Default: daily
}

/**
 * Extracts trigger source from message
 * Uses keyword matching - actual app validation happens dynamically via Pipedream
 * This is just a helper for AI workflow generation, not a restriction
 */
function extractTriggerSource(message: string): string | undefined {
  // Common trigger keywords that map to Pipedream components
  // Note: This is just for AI hints - actual apps are validated dynamically via Pipedream
  const triggerKeywords: Record<string, string[]> = {
    'webhook': ['webhook', 'http', 'api'],
    'email': ['email', 'gmail', 'outlook', 'mail'],
    'slack': ['slack', 'message', 'notification'],
    'github': ['github', 'git', 'repository'],
    'form': ['form', 'submit', 'survey'],
    'schedule': ['schedule', 'cron', 'daily', 'weekly', 'monthly'],
    'database': ['database', 'db', 'sql', 'postgres', 'mysql'],
    'calendar': ['calendar', 'event', 'meeting'],
  };

  const normalizedMessage = message.toLowerCase();
  
  // Check for trigger keywords
  for (const [triggerType, keywords] of Object.entries(triggerKeywords)) {
    if (keywords.some(keyword => normalizedMessage.includes(keyword))) {
      return triggerType;
    }
  }

  // If no match, return undefined - the AI will determine the best trigger
  return undefined;
}

/**
 * Extracts condition from message
 */
function extractCondition(message: string): string {
  // Try to extract the condition part after "when" or "if"
  const whenMatch = message.match(/when\s+(.+?)(?:,|then|do|send)/i);
  const ifMatch = message.match(/if\s+(.+?)(?:,|then|do|send)/i);
  
  if (whenMatch) {
    return whenMatch[1].trim();
  }
  if (ifMatch) {
    return ifMatch[1].trim();
  }
  
  return 'condition_met';
}

/**
 * Extracts email parameters from message
 */
function extractEmailParameters(message: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  
  // Try to extract recipient
  const toMatch = message.match(/to\s+([^\s,]+@[^\s,]+)/i);
  if (toMatch) {
    params.to = toMatch[1];
  }
  
  // Try to extract subject
  const subjectMatch = message.match(/subject[:\s]+([^,]+)/i);
  if (subjectMatch) {
    params.subject = subjectMatch[1].trim();
  }
  
  return params;
}

/**
 * Extracts message parameters from message
 */
function extractMessageParameters(message: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  
  // Try to extract channel
  const channelMatch = message.match(/channel[:\s]+([^\s,]+)/i);
  if (channelMatch) {
    params.channel = channelMatch[1].trim();
  }
  
  return params;
}

/**
 * Generates a workflow name based on detected patterns
 */
function generateWorkflowName(
  intent: string,
  trigger: WorkflowTrigger,
  actions: WorkflowAction[]
): string {
  const parts: string[] = [];
  
  // Add trigger info
  if (trigger.type === 'schedule') {
    parts.push('Scheduled');
  } else if (trigger.type === 'event') {
    parts.push(trigger.source ? capitalize(trigger.source) : 'Event');
  }
  
  // Add action info
  if (actions.length > 0) {
    const actionType = actions[0].type;
    if (actionType.includes('email')) {
      parts.push('Email');
    } else if (actionType.includes('message')) {
      parts.push('Notification');
    } else if (actionType.includes('data')) {
      parts.push('Data');
    }
  }
  
  // Add intent
  if (intent === 'automation') {
    parts.push('Automation');
  } else if (intent === 'notification') {
    parts.push('Notification');
  }
  
  return parts.length > 0 ? parts.join(' ') : 'Workflow';
}

/**
 * Generates a description based on detected patterns
 */
function generateDescription(
  intent: string,
  trigger: WorkflowTrigger,
  actions: WorkflowAction[]
): string {
  const parts: string[] = [];
  
  // Trigger description
  if (trigger.type === 'schedule') {
    parts.push(`Runs on schedule: ${trigger.condition || 'daily'}`);
  } else if (trigger.type === 'event') {
    parts.push(`Triggers when: ${trigger.condition || 'event occurs'}`);
  } else {
    parts.push('Manual workflow');
  }
  
  // Action description
  if (actions.length > 0) {
    const actionDescs = actions.map(a => {
      if (a.type.includes('email')) {
        return 'sends an email';
      }
      if (a.type.includes('message')) {
        return 'sends a notification';
      }
      if (a.type.includes('data')) {
        return 'updates data';
      }
      return 'executes action';
    });
    parts.push(`Performs: ${actionDescs.join(', ')}`);
  }
  
  return parts.join('. ') || 'A workflow automation';
}

/**
 * Validates and normalizes the workflow structure
 */
function validateAndNormalize(workflow: NormalizedWorkflow): NormalizedWorkflow {
  // Ensure required fields are present
  return {
    intent: workflow.intent || 'general_workflow',
    name: workflow.name || 'Untitled Workflow',
    description: workflow.description || 'No description provided',
    trigger: {
      type: workflow.trigger?.type || 'manual',
      source: workflow.trigger?.source,
      condition: workflow.trigger?.condition,
    },
    actions: Array.isArray(workflow.actions) && workflow.actions.length > 0
      ? workflow.actions
      : [{
          type: 'generic_action',
          operation: 'execute',
          parameters: {},
        }],
  };
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

