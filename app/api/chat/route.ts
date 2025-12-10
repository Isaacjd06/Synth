import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { hasFullAccess } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { detectChatIntent } from "@/lib/ai";
import { logUsage } from "@/lib/usage";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { logError } from "@/lib/error-logger";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createRateLimiter, rateLimitOrThrow } from "@/lib/rate-limit";
import {
  getRelevantMemories,
  formatMemoriesForContext,
  storeMemory,
  updateMemoryAccess,
} from "@/lib/memory";
import { BRANDING_INSTRUCTIONS } from "@/lib/ai-branding";
import { SYNTH_IDENTITY } from "@/lib/synth-identity";

const chatLimiter = createRateLimiter("chat", 20, 60);

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  session_id: z.string().optional(), // Optional session ID for continuing conversation
});

/**
 * POST /api/chat
 *
 * Processes chat messages and takes actions based on intent.
 *
 * Requirements:
 * - User must be authenticated
 * - Request body must contain { message: string, session_id?: string }
 *
 * Returns chat response with action taken and workflow ID if applicable.
 */
export async function POST(req: Request) {
  try {
    // 0. Check rate limit
    await rateLimitOrThrow(req, chatLimiter);

    // 1. Authenticate user
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    // 2. Check if user has full access (paid or trial)
    const userHasAccess = await hasFullAccess(userId);
    if (!userHasAccess) {
      // User is unpaid - return NO_ACCESS response
      return NextResponse.json(
        {
          ok: false,
          errorCode: "NO_ACCESS",
          message: "You currently don't have access. Please pay to continue using Synth.",
          requiresSubscription: true,
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { message, session_id } = validationResult.data;

    // 4. Generate or use existing session_id (conversation_id)
    const conversationId = session_id || randomUUID();

    // 5. Save user message to chat_messages table
    const userMessage = await prisma.chatMessage.create({
      data: {
        user_id: userId,
        role: "user",
        content: message,
        conversation_id: conversationId,
      },
    });

    // 5a. Log usage
    await logUsage(userId, "chat_message");

    // 5b. Log audit event
    await logAudit("chat.message", userId, {
      message_id: userMessage.id,
      conversation_id: conversationId,
    });

    // 5c. Emit event
    Events.emit("chat:message", {
      message_id: userMessage.id,
      user_id: userId,
      conversation_id: conversationId,
    });

    // 6. Retrieve relevant memories for context
    const relevantMemories = await getRelevantMemories(userId, undefined, 5);
    const memoryContext = formatMemoriesForContext(relevantMemories);

    // Update last_accessed for retrieved memories
    for (const memory of relevantMemories) {
      await updateMemoryAccess(memory.id).catch(() => {
        // Ignore errors updating access time
      });
    }

    // 6a. Fetch knowledge base context (user-specific + hardcoded) - ALWAYS REQUIRED
    const { fetchKnowledgeContext, formatKnowledgeContextForPrompt } = await import("@/lib/knowledge-context");
    const knowledgeContextData = await fetchKnowledgeContext(userId);
    // Always include hardcoded knowledge - this is Synth's PRIMARY source of expertise
    const knowledgeContext = formatKnowledgeContextForPrompt(knowledgeContextData, true);

    // 7. Detect intent using AI
    const intentResult = await detectChatIntent(message);

    if (!intentResult.ok) {
      // If intent detection fails, save error response
      const errorResponse = await prisma.chatMessage.create({
        data: {
          user_id: userId,
          role: "assistant",
          content:
            "I'm sorry, I couldn't process your message. Please try again.",
          conversation_id: conversationId,
          metadata: { error: intentResult.error },
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: intentResult.error,
          session_id: conversationId,
          messages: [
            {
              id: userMessage.id,
              role: userMessage.role,
              content: userMessage.content,
              created_at: userMessage.created_at,
            },
            {
              id: errorResponse.id,
              role: errorResponse.role,
              content: errorResponse.content,
              created_at: errorResponse.created_at,
            },
          ],
        },
        { status: 500 },
      );
    }

    const intent = intentResult.intent;
    let assistantContent = "";
    let actionTaken: "create_workflow" | "run_workflow" | "general_response" =
      "general_response";
    let workflowId: string | undefined = undefined;

    // 8. Process message based on intent
    if (intent === "create_workflow") {
      actionTaken = "create_workflow";

      // Call /api/workflows/generate internally
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const generateResponse = await fetch(
          `${baseUrl}/api/workflows/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Forward auth headers if available
              Cookie: req.headers.get("cookie") || "",
            },
            body: JSON.stringify({ intent: message }),
          },
        );

        const generateData = await generateResponse.json();

        if (generateData.ok && generateData.workflow) {
          workflowId = generateData.workflow.id;
          assistantContent = `I've created a new workflow "${generateData.workflow.name}" for you. The workflow has been generated and saved. Workflow ID: ${workflowId}`;
        } else {
          // Capture workflow_id even on partial failure (created in DB but Pipedream failed)
          if (generateData.workflow?.id) {
            workflowId = generateData.workflow.id;
          }
          assistantContent = `I tried to create a workflow, but encountered an error: ${generateData.error || "Unknown error"}`;
        }
      } catch (error: unknown) {
        logError("app/api/chat (workflow creation)", error, {
          user_id: userId,
          intent: "create_workflow",
        });
        assistantContent = `I encountered an error while creating the workflow: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    } else if (intent === "run_workflow") {
      actionTaken = "run_workflow";

      // Extract workflow ID from message (simple pattern matching)
      const workflowIdMatch =
        message.match(/workflow\s+([a-f0-9-]{36})/i) ||
        message.match(/id\s+([a-f0-9-]{36})/i);

      if (workflowIdMatch) {
        workflowId = workflowIdMatch[1];

        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          const runResponse = await fetch(
            `${baseUrl}/api/workflows/${workflowId}/run`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: req.headers.get("cookie") || "",
              },
            },
          );

          const runData = await runResponse.json();

          if (runData.ok && runData.execution) {
            assistantContent = `I've executed the workflow. Execution ID: ${runData.execution.id}. Status: ${runData.execution.status}`;
          } else {
            assistantContent = `I tried to run the workflow, but encountered an error: ${runData.error || "Unknown error"}`;
          }
        } catch (error: unknown) {
          logError("app/api/chat (workflow execution)", error, {
            user_id: userId,
            workflow_id: workflowId,
            intent: "run_workflow",
          });
          assistantContent = `I encountered an error while running the workflow: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      } else {
        assistantContent =
          "I understand you want to run a workflow, but I couldn't find a workflow ID in your message. Please provide the workflow ID.";
      }
    } else if (intent === "update_workflow") {
      // TODO: Implement update_workflow action
      assistantContent =
        "Workflow updates are not yet implemented. This feature is coming soon.";
    } else {
      // general_response
      actionTaken = "general_response";

      // Generate a general AI response with memory context and knowledge base
      const generalResponseResult = await generateGeneralResponse(
        message,
        memoryContext,
        knowledgeContext
      );

      if (generalResponseResult.ok && generalResponseResult.response) {
        assistantContent = generalResponseResult.response;
      } else {
        assistantContent =
          "I'm here to help you with workflow automation. You can ask me to create workflows, run them, or ask general questions.";
      }
    }

    // 9. Store memory from this interaction if it's meaningful
    if (actionTaken === "general_response" && assistantContent.length > 50) {
      // Store conversation context as memory
      try {
        await storeMemory(
          userId,
          "conversation",
          {
            user_message: message,
            assistant_response: assistantContent,
            conversation_id: conversationId,
            intent,
          },
          null,
          {
            created_from: "chat",
            timestamp: new Date().toISOString(),
          }
        ).catch(() => {
          // Ignore errors storing memory - non-critical
        });
      } catch {
        // Ignore memory storage errors
      }
    }

    // 10. Save assistant response to chat_messages
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        user_id: userId,
        role: "assistant",
        content: assistantContent,
        conversation_id: conversationId,
        metadata: {
          intent,
          action_taken: actionTaken,
          workflow_id: workflowId,
        },
      },
    });

    // 11. Fetch all messages in this conversation
    const conversationMessages = await prisma.chatMessage.findMany({
      where: {
        conversation_id: conversationId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // 12. Return response
    return NextResponse.json(
      {
        ok: true,
        session_id: conversationId,
        messages: conversationMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          metadata: msg.metadata,
        })),
        action_taken: actionTaken,
        workflow_id: workflowId,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    logError("app/api/chat", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * Generate a general AI response for chat
 * 
 * @param message - User's message
 * @param memoryContext - Optional context from memory system
 * @param knowledgeContext - Optional context from knowledge base (user-specific + hardcoded)
 */
async function generateGeneralResponse(
  message: string,
  memoryContext?: string,
  knowledgeContext?: string,
): Promise<{ ok: boolean; response?: string; error?: string }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
  const ANTHROPIC_BACKEND_API_KEY = process.env.ANTHROPIC_BACKEND_API_KEY?.trim();

  if (!OPENAI_API_KEY && !ANTHROPIC_BACKEND_API_KEY) {
    return {
      ok: false,
      error: "No AI API key configured",
    };
  }

  try {
    if (OPENAI_API_KEY) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  `${SYNTH_IDENTITY}

${BRANDING_INSTRUCTIONS}

Your capabilities include:
- Providing strategic business advice and recommendations HEAVILY RELYING on your knowledge base
- Analyzing workflow performance, statistics, and execution results using knowledge base frameworks
- Understanding business context and applying knowledge from Synth's knowledge base
- Generating workflows from natural language informed by automation best practices from knowledge base
- Answering questions about business automation, strategy, and operations using knowledge base expertise

## KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF EXPERTISE
${knowledgeContext ? knowledgeContext : "Loading knowledge base..."}

${memoryContext ? `\n\n## MEMORY CONTEXT\n${memoryContext}\n\n` : ""}

CRITICAL: Your knowledge base is your PRIMARY SOURCE of business expertise. You MUST:
- Heavily rely on knowledge base frameworks, principles, and methodologies when providing advice
- Reference specific knowledge base concepts when answering business questions
- Apply knowledge base best practices to all strategic recommendations
- Ground all business analysis in knowledge base principles
- Use knowledge base terminology and frameworks consistently

Always speak as Synth itself. You ARE Synth's intelligence. Your expertise comes from your comprehensive knowledge base combined with the user's specific business context.`,
              },
              {
                role: "user",
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000, // Increased for more comprehensive responses
          }),
        },
      );

      if (!response.ok) {
        // Try to parse the error response from OpenAI
        let errorMessage = "Failed to generate response";
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
          } else if (errorData.error) {
            errorMessage = `OpenAI API error: ${JSON.stringify(errorData.error)}`;
          }
        } catch {
          // If we can't parse the error, use the default message
        }
        return { ok: false, error: errorMessage };
      }

      const data = await response.json();
      return {
        ok: true,
        response:
          data.choices?.[0]?.message?.content ||
          "I'm here to help with workflow automation.",
      };
    } else if (ANTHROPIC_BACKEND_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_BACKEND_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000, // Increased for more comprehensive responses
          system:
            `${SYNTH_IDENTITY}

${BRANDING_INSTRUCTIONS}

Your capabilities include:
- Providing strategic business advice and recommendations HEAVILY RELYING on your knowledge base
- Analyzing workflow performance, statistics, and execution results using knowledge base frameworks
- Understanding business context and applying knowledge from Synth's knowledge base
- Generating workflows from natural language informed by automation best practices from knowledge base
- Answering questions about business automation, strategy, and operations using knowledge base expertise

## KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF EXPERTISE
${knowledgeContext ? knowledgeContext : "Loading knowledge base..."}

${memoryContext ? `\n\n## MEMORY CONTEXT\n${memoryContext}\n\n` : ""}

CRITICAL: Your knowledge base is your PRIMARY SOURCE of business expertise. You MUST:
- Heavily rely on knowledge base frameworks, principles, and methodologies when providing advice
- Reference specific knowledge base concepts when answering business questions
- Apply knowledge base best practices to all strategic recommendations
- Ground all business analysis in knowledge base principles
- Use knowledge base terminology and frameworks consistently

Always speak as Synth itself. You ARE Synth's intelligence. Your expertise comes from your comprehensive knowledge base combined with the user's specific business context.`,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        // Try to parse the error response from Anthropic
        let errorMessage = "Failed to generate response";
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = `Anthropic API error: ${errorData.error.message}`;
          } else if (errorData.error) {
            errorMessage = `Anthropic API error: ${JSON.stringify(errorData.error)}`;
          }
        } catch {
          // If we can't parse the error, use the default message
        }
        return { ok: false, error: errorMessage };
      }

      const data = await response.json();
      return {
        ok: true,
        response:
          data.content?.[0]?.text ||
          "I'm here to help with workflow automation.",
      };
    }
  } catch (error: unknown) {
    logError("app/api/chat (generateGeneralResponse)", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate response",
    };
  }

  return {
    ok: false,
    error: "No AI provider available",
  };
}
