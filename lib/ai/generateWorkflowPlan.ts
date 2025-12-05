import type { WorkflowPlan } from "@/lib/workflow/types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

type GenerateWorkflowPlanResult =
  | {
      ok: true;
      draft: WorkflowPlan;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Generates a WorkflowPlan JSON draft from natural language prompt
 * Uses OpenAI API to convert user intent into structured workflow JSON
 */
export async function generateWorkflowPlan(
  prompt: string
): Promise<GenerateWorkflowPlanResult> {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error: "OPENAI_API_KEY is not configured. Please set it in your environment variables.",
    };
  }

  if (!prompt || prompt.trim().length === 0) {
    return {
      ok: false,
      error: "Prompt cannot be empty",
    };
  }

  const systemPrompt = `You are a workflow automation expert. Your job is to convert natural language instructions into a valid WorkflowPlan JSON object.

CRITICAL RULES:
1. You MUST return ONLY valid JSON that matches the WorkflowPlan interface exactly
2. The JSON must have these exact fields:
   - name: string (required)
   - description: string (optional)
   - intent: string (optional)
   - trigger: object with { type: string, config: object }
   - actions: array of action objects

3. Trigger types allowed:
   - "manual" → { type: "manual", config: {} }
   - "webhook" → { type: "webhook", config: { path: string, method?: string } }
   - "cron" → { type: "cron", config: { cronExpression?: string, interval?: { amount: number, unit: string } } }

4. Action types allowed:
   - "send_email" → { id: string, type: "send_email", params: { to: string, subject: string, body: string, from?: string }, onSuccessNext: string[], onFailureNext: string[] }
   - "http_request" → { id: string, type: "http_request", params: { url: string, method?: string, headers?: object, query?: object, body?: any }, onSuccessNext: string[], onFailureNext: string[] }
   - "set_data" → { id: string, type: "set_data", params: { fields: object }, onSuccessNext: string[], onFailureNext: string[] }
   - "delay" → { id: string, type: "delay", params: { durationMs?: number, structured?: { amount: number, unit: string } }, onSuccessNext: string[], onFailureNext: string[] }

5. Action IDs must be simple strings like "step_1", "step_2", etc.
6. For multi-step workflows, use onSuccessNext to chain actions: ["step_2"] means step_1 succeeds → go to step_2
7. All required params must be included (no undefined values)
8. Use placeholder values for emails, URLs, etc. (e.g., "user@example.com", "https://hooks.slack.com/services/YOUR/WEBHOOK/URL")

EXAMPLE OUTPUT:
{
  "name": "Send Welcome Email",
  "description": "Sends a welcome email to new users",
  "intent": "Automatically welcome new users via email",
  "trigger": {
    "type": "manual",
    "config": {}
  },
  "actions": [
    {
      "id": "step_1",
      "type": "send_email",
      "params": {
        "to": "user@example.com",
        "subject": "Welcome!",
        "body": "Welcome to our service!"
      },
      "onSuccessNext": [],
      "onFailureNext": []
    }
  ]
}

Return ONLY the JSON object, no markdown, no code blocks, no explanations.`;

  const userPrompt = `Convert this natural language instruction into a WorkflowPlan JSON:

"${prompt}"

Return ONLY valid JSON matching the WorkflowPlan structure.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
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

    // Parse the JSON response
    // Handle potential markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      // Remove markdown code blocks if present
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    let draft: WorkflowPlan;
    try {
      draft = JSON.parse(cleanedContent);
    } catch (parseError) {
      return {
        ok: false,
        error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      };
    }

    // Basic validation
    if (!draft.name || typeof draft.name !== "string") {
      return {
        ok: false,
        error: "Generated workflow missing required 'name' field",
      };
    }

    if (!draft.trigger || typeof draft.trigger !== "object") {
      return {
        ok: false,
        error: "Generated workflow missing required 'trigger' field",
      };
    }

    if (!Array.isArray(draft.actions)) {
      return {
        ok: false,
        error: "Generated workflow 'actions' must be an array",
      };
    }

    // Validate actions have required fields
    for (let i = 0; i < draft.actions.length; i++) {
      const action = draft.actions[i];
      if (!action.id || !action.type || !action.params) {
        return {
          ok: false,
          error: `Action at index ${i} missing required fields (id, type, or params)`,
        };
      }
      if (!Array.isArray(action.onSuccessNext)) {
        action.onSuccessNext = [];
      }
      if (!Array.isArray(action.onFailureNext)) {
        action.onFailureNext = [];
      }
    }

    return {
      ok: true,
      draft,
    };
  } catch (error: any) {
    console.error("Error generating workflow plan:", error);
    return {
      ok: false,
      error: error.message || "Failed to generate workflow plan",
    };
  }
}

