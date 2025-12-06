import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

interface BrainRequestBody {
  message: string;
}

// Later you will swap this with the Claude API call
async function askClaude(prompt: string) {
  return {
    message: "This is a placeholder response. The Claude integration goes here.",
    plan: null,
  };
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json() as BrainRequestBody;
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    // 1. Load relevant memory for this user
    const memories = await prisma.memory.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    // 2. Prepare structured prompt
    const prompt = `
You are Synth, a business automation AI.
You always respond in structured JSON.

User message:
"${message}"

Available Memory (JSON):
${JSON.stringify(memories, null, 2)}

Your job:
1. Interpret user intent
2. Suggest possible automations
3. Reference any relevant memory
4. Never hallucinate capabilities beyond today's AI limitations
5. Return ONLY JSON with this shape:

{
  "reply": "A natural language response to show in chat.",
  "intent": "summary of user's intent",
  "memory_to_write": [
     { "key": "...", "value": "..." }
  ],
  "workflow_plan": {
     "should_create_workflow": boolean,
     "workflow_name": "...",
     "trigger": {},
     "actions": []
  }
}
`;

    // 3. Ask the AI model (placeholder for now)
    const aiResponse = await askClaude(prompt);

    return NextResponse.json(
      {
        ok: true,
        data: aiResponse,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("BRAIN API ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
