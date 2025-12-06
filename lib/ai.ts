import { WorkflowBlueprint, WorkflowBlueprintSchema } from "@/lib/schemas/workflowSchema";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type GenerateWorkflowBlueprintResult =
  | {
      ok: true;
      blueprint: WorkflowBlueprint;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Generates a workflow blueprint from natural language intent using AI
 * Supports both OpenAI and Anthropic (Claude) APIs
 */
export async function generateWorkflowBlueprint(
  intent: string
): Promise<GenerateWorkflowBlueprintResult> {
  if (!intent || intent.trim().length === 0) {
    return {
      ok: false,
      error: "Intent cannot be empty",
    };
  }

  // Prefer OpenAI if available, otherwise use Anthropic
  if (OPENAI_API_KEY) {
    return generateWithOpenAI(intent);
  } else if (ANTHROPIC_API_KEY) {
    return generateWithAnthropic(intent);
  } else {
    return {
      ok: false,
      error: "No AI API key configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables.",
    };
  }
}

/**
 * Generate workflow blueprint using OpenAI
 */
async function generateWithOpenAI(intent: string): Promise<GenerateWorkflowBlueprintResult> {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const systemPrompt = `You are a workflow automation expert. Your job is to convert natural language instructions into a valid workflow blueprint JSON object.

CRITICAL RULES:
1. You MUST return ONLY valid JSON that matches this exact structure:
{
  "name": "string (required)",
  "description": "string (optional)",
  "trigger": {
    "type": "string (e.g., 'webhook', 'cron', 'manual', 'email', 'slack', etc.)",
    "app": "string (e.g., 'gmail', 'slack', 'http', 'schedule', etc.)",
    "config": {} // object with app-specific configuration
  },
  "actions": [
    {
      "type": "string (e.g., 'send_email', 'post_message', 'http_request', 'create_record', etc.)",
      "app": "string (e.g., 'gmail', 'slack', 'http', 'airtable', etc.)",
      "operation": "string (specific operation name for the app)",
      "config": {} // object with operation-specific configuration
    }
  ]
}

2. The trigger represents what starts the workflow:
   - type: The trigger type (webhook, cron, manual, email, etc.)
   - app: The application/service that provides the trigger
   - config: App-specific configuration (e.g., webhook path, cron schedule, email filters)

3. Actions are the steps that execute:
   - type: The action type (send_email, post_message, http_request, etc.)
   - app: The application/service that performs the action
   - operation: The specific operation (e.g., "send", "create", "update", "post")
   - config: Operation-specific configuration (e.g., recipient, message, URL, etc.)

4. Use realistic app names and operations based on the intent
5. Include placeholder values in config that make sense for the operation
6. Always include at least one action

EXAMPLE OUTPUT:
{
  "name": "Send Welcome Email",
  "description": "Automatically sends a welcome email when a new user signs up",
  "trigger": {
    "type": "webhook",
    "app": "http",
    "config": {
      "path": "/webhook/new-user",
      "method": "POST"
    }
  },
  "actions": [
    {
      "type": "send_email",
      "app": "gmail",
      "operation": "send",
      "config": {
        "to": "{{trigger.body.email}}",
        "subject": "Welcome!",
        "body": "Thanks for joining us!"
      }
    }
  ]
}

Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

  const userPrompt = `Convert this natural language intent into a workflow blueprint JSON:

"${intent}"

Return ONLY valid JSON matching the exact structure specified.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        ok: false,
        error: "No response from OpenAI API",
      };
    }

    // Parse and validate the JSON response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      return {
        ok: false,
        error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      };
    }

    // Validate against Zod schema
    const validationResult = WorkflowBlueprintSchema.safeParse(parsed);
    if (!validationResult.success) {
      return {
        ok: false,
        error: `Invalid workflow blueprint structure: ${validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    return {
      ok: true,
      blueprint: validationResult.data,
    };
  } catch (error: any) {
    console.error("Error generating workflow blueprint with OpenAI:", error);
    return {
      ok: false,
      error: error.message || "Failed to generate workflow blueprint",
    };
  }
}

/**
 * Generate workflow blueprint using Anthropic (Claude)
 */
async function generateWithAnthropic(intent: string): Promise<GenerateWorkflowBlueprintResult> {
  if (!ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY is not configured",
    };
  }

  const systemPrompt = `You are a workflow automation expert. Your job is to convert natural language instructions into a valid workflow blueprint JSON object.

CRITICAL RULES:
1. You MUST return ONLY valid JSON that matches this exact structure:
{
  "name": "string (required)",
  "description": "string (optional)",
  "trigger": {
    "type": "string (e.g., 'webhook', 'cron', 'manual', 'email', 'slack', etc.)",
    "app": "string (e.g., 'gmail', 'slack', 'http', 'schedule', etc.)",
    "config": {} // object with app-specific configuration
  },
  "actions": [
    {
      "type": "string (e.g., 'send_email', 'post_message', 'http_request', 'create_record', etc.)",
      "app": "string (e.g., 'gmail', 'slack', 'http', 'airtable', etc.)",
      "operation": "string (specific operation name for the app)",
      "config": {} // object with operation-specific configuration
    }
  ]
}

2. The trigger represents what starts the workflow
3. Actions are the steps that execute
4. Use realistic app names and operations based on the intent
5. Include placeholder values in config that make sense
6. Always include at least one action

Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

  const userPrompt = `Convert this natural language intent into a workflow blueprint JSON:

"${intent}"

Return ONLY valid JSON matching the exact structure specified.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: `Anthropic API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return {
        ok: false,
        error: "No response from Anthropic API",
      };
    }

    // Parse and validate the JSON response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      return {
        ok: false,
        error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      };
    }

    // Validate against Zod schema
    const validationResult = WorkflowBlueprintSchema.safeParse(parsed);
    if (!validationResult.success) {
      return {
        ok: false,
        error: `Invalid workflow blueprint structure: ${validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    return {
      ok: true,
      blueprint: validationResult.data,
    };
  } catch (error: any) {
    console.error("Error generating workflow blueprint with Anthropic:", error);
    return {
      ok: false,
      error: error.message || "Failed to generate workflow blueprint",
    };
  }
}

/**
 * Intent categories for chat messages
 */
export type ChatIntent = "create_workflow" | "update_workflow" | "run_workflow" | "general_response";

/**
 * Result type for intent detection
 */
type DetectIntentResult =
  | {
      ok: true;
      intent: ChatIntent;
      confidence?: number;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Detects the intent category of a chat message using AI
 */
export async function detectChatIntent(message: string): Promise<DetectIntentResult> {
  if (!message || message.trim().length === 0) {
    return {
      ok: false,
      error: "Message cannot be empty",
    };
  }

  // Prefer OpenAI if available, otherwise use Anthropic
  if (OPENAI_API_KEY) {
    return detectIntentWithOpenAI(message);
  } else if (ANTHROPIC_API_KEY) {
    return detectIntentWithAnthropic(message);
  } else {
    // Fallback to simple keyword matching if no AI API key
    return detectIntentWithKeywords(message);
  }
}

/**
 * Detect intent using OpenAI
 */
async function detectIntentWithOpenAI(message: string): Promise<DetectIntentResult> {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const systemPrompt = `You are an intent classifier for a workflow automation platform. Analyze user messages and classify them into one of these categories:

1. "create_workflow" - User wants to create a new workflow (e.g., "create a workflow to send emails", "make a workflow that...", "I need a workflow for...")
2. "update_workflow" - User wants to modify an existing workflow (e.g., "update workflow X", "change the workflow", "modify workflow")
3. "run_workflow" - User wants to execute/run a workflow (e.g., "run workflow X", "execute workflow", "trigger workflow")
4. "general_response" - General chat, questions, or other non-workflow actions

Return ONLY a JSON object with this structure:
{
  "intent": "create_workflow" | "update_workflow" | "run_workflow" | "general_response",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `OpenAI API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        ok: false,
        error: "No response from OpenAI API",
      };
    }

    const parsed = JSON.parse(content);
    const intent = parsed.intent as ChatIntent;

    if (!["create_workflow", "update_workflow", "run_workflow", "general_response"].includes(intent)) {
      return {
        ok: false,
        error: `Invalid intent returned: ${intent}`,
      };
    }

    return {
      ok: true,
      intent,
      confidence: parsed.confidence,
    };
  } catch (error: any) {
    console.error("Error detecting intent with OpenAI:", error);
    // Fallback to keyword matching
    return detectIntentWithKeywords(message);
  }
}

/**
 * Detect intent using Anthropic
 */
async function detectIntentWithAnthropic(message: string): Promise<DetectIntentResult> {
  if (!ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY is not configured",
    };
  }

  const systemPrompt = `You are an intent classifier for a workflow automation platform. Analyze user messages and classify them into one of these categories:

1. "create_workflow" - User wants to create a new workflow
2. "update_workflow" - User wants to modify an existing workflow
3. "run_workflow" - User wants to execute/run a workflow
4. "general_response" - General chat, questions, or other non-workflow actions

Return ONLY a JSON object: {"intent": "category", "confidence": 0.0-1.0}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Anthropic API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return {
        ok: false,
        error: "No response from Anthropic API",
      };
    }

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    const parsed = JSON.parse(cleanedContent);
    const intent = parsed.intent as ChatIntent;

    if (!["create_workflow", "update_workflow", "run_workflow", "general_response"].includes(intent)) {
      return {
        ok: false,
        error: `Invalid intent returned: ${intent}`,
      };
    }

    return {
      ok: true,
      intent,
      confidence: parsed.confidence,
    };
  } catch (error: any) {
    console.error("Error detecting intent with Anthropic:", error);
    // Fallback to keyword matching
    return detectIntentWithKeywords(message);
  }
}

/**
 * Fallback keyword-based intent detection
 */
function detectIntentWithKeywords(message: string): DetectIntentResult {
  const lowerMessage = message.toLowerCase();

  // Check for create workflow keywords
  if (
    lowerMessage.includes("create") ||
    lowerMessage.includes("make") ||
    lowerMessage.includes("build") ||
    lowerMessage.includes("new workflow") ||
    lowerMessage.includes("workflow to") ||
    lowerMessage.includes("workflow that")
  ) {
    return {
      ok: true,
      intent: "create_workflow",
      confidence: 0.7,
    };
  }

  // Check for update workflow keywords
  if (
    lowerMessage.includes("update") ||
    lowerMessage.includes("modify") ||
    lowerMessage.includes("change") ||
    lowerMessage.includes("edit")
  ) {
    return {
      ok: true,
      intent: "update_workflow",
      confidence: 0.7,
    };
  }

  // Check for run workflow keywords
  if (
    lowerMessage.includes("run") ||
    lowerMessage.includes("execute") ||
    lowerMessage.includes("trigger") ||
    lowerMessage.includes("start workflow")
  ) {
    return {
      ok: true,
      intent: "run_workflow",
      confidence: 0.7,
    };
  }

  // Default to general response
  return {
    ok: true,
    intent: "general_response",
    confidence: 0.5,
  };
}

