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
  const requestId = randomUUID();
  console.log(`[CHAT:${requestId}] CHECKPOINT: Request received`);
  
  // Declare variables at function scope to avoid temporal dead zone errors
  let message: string | undefined;
  let session_id: string | undefined;
  let userId: string | undefined;
  let conversationId: string | undefined;
  let userMessage: any;
  let assistantContent: string = "";
  let actionTaken: "create_workflow" | "run_workflow" | "general_response" = "general_response";
  let workflowId: string | undefined = undefined;
  
  try {
    // 0. Validate AI API key configuration
    console.log(`[CHAT:${requestId}] CHECKPOINT: Validating AI API keys`);
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
    const ANTHROPIC_BACKEND_API_KEY = process.env.ANTHROPIC_BACKEND_API_KEY?.trim();
    
    if (!OPENAI_API_KEY && !ANTHROPIC_BACKEND_API_KEY) {
      console.error(`[CHAT:${requestId}] ERROR: No AI API key configured`);
      return NextResponse.json(
        {
          ok: false,
          error: "AI service is not configured. Please set OPENAI_API_KEY in your environment variables.",
          errorCode: "AI_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }
    console.log(`[CHAT:${requestId}] CHECKPOINT: AI API keys validated (OpenAI: ${!!OPENAI_API_KEY}, Anthropic: ${!!ANTHROPIC_BACKEND_API_KEY})`);

    // 0a. Check rate limit
    console.log(`[CHAT:${requestId}] CHECKPOINT: Checking rate limit`);
    try {
      await rateLimitOrThrow(req, chatLimiter);
      console.log(`[CHAT:${requestId}] CHECKPOINT: Rate limit check passed`);
    } catch (rateLimitError) {
      console.error(`[CHAT:${requestId}] ERROR: Rate limit exceeded`, rateLimitError);
      throw rateLimitError;
    }

    // 1. Authenticate user
    console.log(`[CHAT:${requestId}] CHECKPOINT: Authenticating user`);
    try {
      const authResult = await authenticateUser();
      if (authResult instanceof NextResponse) {
        console.error(`[CHAT:${requestId}] ERROR: Authentication failed`);
        return authResult; // Returns 401
      }
      userId = authResult.userId;
      if (!userId || typeof userId !== "string") {
        console.error(`[CHAT:${requestId}] ERROR: Invalid userId from auth`, { userId, type: typeof userId });
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid user authentication",
            errorCode: "AUTH_INVALID",
          },
          { status: 401 }
        );
      }
      console.log(`[CHAT:${requestId}] CHECKPOINT: User authenticated (userId: ${userId.substring(0, 8)}...)`);
    } catch (authError) {
      console.error(`[CHAT:${requestId}] ERROR: Authentication exception`, authError);
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication failed",
          errorCode: "AUTH_ERROR",
        },
        { status: 401 }
      );
    }

    // 2. Check if user has full access (paid or trial)
    console.log(`[CHAT:${requestId}] CHECKPOINT: Checking user access`);
    let userHasAccess: boolean;
    try {
      userHasAccess = await hasFullAccess(userId);
      console.log(`[CHAT:${requestId}] CHECKPOINT: Access check complete (hasAccess: ${userHasAccess})`);
    } catch (accessError) {
      console.error(`[CHAT:${requestId}] ERROR: Access check failed`, accessError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to verify access",
          errorCode: "ACCESS_CHECK_ERROR",
        },
        { status: 500 }
      );
    }
    
    if (!userHasAccess) {
      console.log(`[CHAT:${requestId}] CHECKPOINT: User lacks access, returning NO_ACCESS`);
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
    console.log(`[CHAT:${requestId}] CHECKPOINT: Parsing request body`);
    let body: any;
    try {
      body = await req.json();
      console.log(`[CHAT:${requestId}] CHECKPOINT: Request body parsed`, { hasMessage: !!body?.message, hasSessionId: !!body?.session_id });
    } catch (parseError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to parse request body`, parseError);
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid JSON in request body",
          errorCode: "PARSE_ERROR",
        },
        { status: 400 }
      );
    }

    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(`[CHAT:${requestId}] ERROR: Request validation failed`, validationResult.error.issues);
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          details: validationResult.error.issues,
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Assign validated values to pre-declared variables
    message = validationResult.data.message;
    session_id = validationResult.data.session_id;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      console.error(`[CHAT:${requestId}] ERROR: Invalid message`, { message, type: typeof message });
      return NextResponse.json(
        {
          ok: false,
          error: "Message is required and must be a non-empty string",
          errorCode: "INVALID_MESSAGE",
        },
        { status: 400 }
      );
    }
    console.log(`[CHAT:${requestId}] CHECKPOINT: Request validated (message length: ${message.length})`);

    // 4. Generate or use existing session_id (conversation_id)
    conversationId = session_id || randomUUID();
    console.log(`[CHAT:${requestId}] CHECKPOINT: Conversation ID resolved (${conversationId.substring(0, 8)}...)`);

    // 5. Save user message to chat_messages table
    console.log(`[CHAT:${requestId}] CHECKPOINT: Saving user message to database`);
    try {
      if (!prisma || !prisma.chatMessage) {
        console.error(`[CHAT:${requestId}] ERROR: prisma.chatMessage is not available`);
        return NextResponse.json(
          {
            ok: false,
            error: "Database service unavailable",
            errorCode: "DB_UNAVAILABLE",
          },
          { status: 500 }
        );
      }

      userMessage = await prisma.chatMessage.create({
        data: {
          user_id: userId,
          role: "user",
          content: message,
          conversation_id: conversationId,
        },
      });

      if (!userMessage || !userMessage.id) {
        console.error(`[CHAT:${requestId}] ERROR: Failed to create user message - no ID returned`, userMessage);
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to save user message",
            errorCode: "DB_WRITE_ERROR",
          },
          { status: 500 }
        );
      }
      console.log(`[CHAT:${requestId}] CHECKPOINT: User message saved (messageId: ${userMessage.id})`);
    } catch (dbError) {
      console.error(`[CHAT:${requestId}] ERROR: Database write failed`, dbError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to save message to database",
          errorCode: "DB_ERROR",
        },
        { status: 500 }
      );
    }

    // 5a. Log usage (non-critical, don't fail on error)
    console.log(`[CHAT:${requestId}] CHECKPOINT: Logging usage`);
    try {
      await logUsage(userId, "chat_message").catch((err) => {
        console.warn(`[CHAT:${requestId}] WARNING: Usage logging failed (non-critical)`, err);
      });
    } catch (err) {
      console.warn(`[CHAT:${requestId}] WARNING: Usage logging exception (non-critical)`, err);
    }

    // 5b. Log audit event (non-critical, don't fail on error)
    console.log(`[CHAT:${requestId}] CHECKPOINT: Logging audit event`);
    try {
      await logAudit("chat.message", userId, {
        message_id: userMessage.id,
        conversation_id: conversationId,
      }).catch((err) => {
        console.warn(`[CHAT:${requestId}] WARNING: Audit logging failed (non-critical)`, err);
      });
    } catch (err) {
      console.warn(`[CHAT:${requestId}] WARNING: Audit logging exception (non-critical)`, err);
    }

    // 5c. Emit event (non-critical, don't fail on error)
    console.log(`[CHAT:${requestId}] CHECKPOINT: Emitting event`);
    try {
      if (Events && typeof Events.emit === "function") {
        Events.emit("chat:message", {
          message_id: userMessage.id,
          user_id: userId,
          conversation_id: conversationId,
        });
      } else {
        console.warn(`[CHAT:${requestId}] WARNING: Events.emit not available (non-critical)`);
      }
    } catch (err) {
      console.warn(`[CHAT:${requestId}] WARNING: Event emission failed (non-critical)`, err);
    }

    // 6. Load comprehensive context for AI
    console.log(`[CHAT:${requestId}] CHECKPOINT: Loading context for AI`);
    let memoryContext = "";
    let chatHistoryContext = "";
    let knowledgeContext = "";
    let workflowContext = "";
    let executionContext = "";

    // 6a. Retrieve relevant memories for context
    console.log(`[CHAT:${requestId}] CHECKPOINT: Loading memories`);
    try {
      const relevantMemories = await getRelevantMemories(userId, undefined, 5);
      if (Array.isArray(relevantMemories)) {
        memoryContext = formatMemoriesForContext(relevantMemories);
        console.log(`[CHAT:${requestId}] CHECKPOINT: Memories loaded (count: ${relevantMemories.length})`);
        
        // Update last_accessed for retrieved memories (non-critical)
        for (const memory of relevantMemories) {
          if (memory && memory.id) {
            await updateMemoryAccess(memory.id).catch(() => {
              // Ignore errors updating access time
            });
          }
        }
      } else {
        console.warn(`[CHAT:${requestId}] WARNING: getRelevantMemories returned non-array`, typeof relevantMemories);
      }
    } catch (memoryError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to load memories`, memoryError);
      // Continue with empty memory context - non-critical
    }

    // 6b. Get recent chat messages for conversation context
    console.log(`[CHAT:${requestId}] CHECKPOINT: Loading chat history`);
    try {
      const {
        getRecentChatMessages,
      } = await import("@/lib/memory-service");
      
      if (typeof getRecentChatMessages !== "function") {
        console.warn(`[CHAT:${requestId}] WARNING: getRecentChatMessages is not a function`);
      } else {
        const recentMessages = await getRecentChatMessages(userId, 10);
        if (Array.isArray(recentMessages)) {
          chatHistoryContext = recentMessages
            .map((msg) => {
              if (msg && msg.role && msg.content) {
                return `${msg.role === "user" ? "User" : "Synth"}: ${msg.content}`;
              }
              return null;
            })
            .filter(Boolean)
            .join("\n");
          console.log(`[CHAT:${requestId}] CHECKPOINT: Chat history loaded (count: ${recentMessages.length})`);
        } else {
          console.warn(`[CHAT:${requestId}] WARNING: getRecentChatMessages returned non-array`, typeof recentMessages);
        }
      }
    } catch (chatHistoryError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to load chat history`, chatHistoryError);
      // Continue with empty chat history - non-critical
    }

    // 6c. Fetch knowledge base context (user-specific + hardcoded) - ALWAYS REQUIRED
    console.log(`[CHAT:${requestId}] CHECKPOINT: Loading knowledge context`);
    try {
      const { fetchKnowledgeContext, formatKnowledgeContextForPrompt } = await import("@/lib/knowledge-context");
      
      if (typeof fetchKnowledgeContext !== "function") {
        console.warn(`[CHAT:${requestId}] WARNING: fetchKnowledgeContext is not a function`);
      } else if (typeof formatKnowledgeContextForPrompt !== "function") {
        console.warn(`[CHAT:${requestId}] WARNING: formatKnowledgeContextForPrompt is not a function`);
      } else {
        const knowledgeContextData = await fetchKnowledgeContext(userId);
        if (knowledgeContextData && typeof knowledgeContextData === "object") {
          knowledgeContext = formatKnowledgeContextForPrompt(knowledgeContextData, true);
          console.log(`[CHAT:${requestId}] CHECKPOINT: Knowledge context loaded (length: ${knowledgeContext.length})`);
        } else {
          console.warn(`[CHAT:${requestId}] WARNING: fetchKnowledgeContext returned invalid data`, typeof knowledgeContextData);
        }
      }
    } catch (knowledgeError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to load knowledge context`, knowledgeError);
      // Continue with empty knowledge context - will use hardcoded knowledge
    }

    // 6d. Fetch workflow and execution context
    console.log(`[CHAT:${requestId}] CHECKPOINT: Loading workflow and execution context`);
    try {
      workflowContext = await buildWorkflowContext(userId);
      if (typeof workflowContext !== "string") {
        console.warn(`[CHAT:${requestId}] WARNING: buildWorkflowContext returned non-string`, typeof workflowContext);
        workflowContext = "";
      } else {
        console.log(`[CHAT:${requestId}] CHECKPOINT: Workflow context loaded (length: ${workflowContext.length})`);
      }
    } catch (workflowError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to load workflow context`, workflowError);
      workflowContext = "";
    }

    try {
      executionContext = await buildExecutionContext(userId);
      if (typeof executionContext !== "string") {
        console.warn(`[CHAT:${requestId}] WARNING: buildExecutionContext returned non-string`, typeof executionContext);
        executionContext = "";
      } else {
        console.log(`[CHAT:${requestId}] CHECKPOINT: Execution context loaded (length: ${executionContext.length})`);
      }
    } catch (executionError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to load execution context`, executionError);
      executionContext = "";
    }

    console.log(`[CHAT:${requestId}] CHECKPOINT: All context loaded successfully`);

    // 7. Detect intent using AI
    console.log(`[CHAT:${requestId}] CHECKPOINT: Detecting intent`);
    let intentResult: any;
    try {
      if (typeof detectChatIntent !== "function") {
        console.error(`[CHAT:${requestId}] ERROR: detectChatIntent is not a function`);
        throw new Error("Intent detection function not available");
      }
      intentResult = await detectChatIntent(message);
      console.log(`[CHAT:${requestId}] CHECKPOINT: Intent detection complete`, { ok: intentResult?.ok, intent: intentResult?.intent });
    } catch (intentError) {
      console.error(`[CHAT:${requestId}] ERROR: Intent detection failed`, intentError);
      // Save error response and return
      try {
        const errorResponse = await prisma.chatMessage.create({
          data: {
            user_id: userId,
            role: "assistant",
            content: "I'm sorry, I couldn't process your message. Please try again.",
            conversation_id: conversationId,
            metadata: { error: intentError instanceof Error ? intentError.message : "Unknown error" },
          },
        });

        return NextResponse.json(
          {
            ok: false,
            error: intentError instanceof Error ? intentError.message : "Intent detection failed",
            errorCode: "INTENT_ERROR",
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
      } catch (dbError) {
        console.error(`[CHAT:${requestId}] ERROR: Failed to save error response`, dbError);
        return NextResponse.json(
          {
            ok: false,
            error: "Intent detection failed and could not save error response",
            errorCode: "INTENT_AND_DB_ERROR",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }
    }

    if (!intentResult || typeof intentResult !== "object") {
      console.error(`[CHAT:${requestId}] ERROR: Invalid intent result`, { type: typeof intentResult, intentResult });
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid intent detection result",
          errorCode: "INTENT_INVALID",
          session_id: conversationId,
        },
        { status: 500 }
      );
    }

    if (!intentResult.ok) {
      console.error(`[CHAT:${requestId}] ERROR: Intent detection returned not ok`, { error: intentResult.error });
      // If intent detection fails, save error response
      try {
        const errorResponse = await prisma.chatMessage.create({
          data: {
            user_id: userId,
            role: "assistant",
            content: "I'm sorry, I couldn't process your message. Please try again.",
            conversation_id: conversationId,
            metadata: { error: intentResult.error || "Unknown error" },
          },
        });

        return NextResponse.json(
          {
            ok: false,
            error: intentResult.error || "Intent detection failed",
            errorCode: "INTENT_FAILED",
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
      } catch (dbError) {
        console.error(`[CHAT:${requestId}] ERROR: Failed to save error response`, dbError);
        return NextResponse.json(
          {
            ok: false,
            error: "Intent detection failed and could not save error response",
            errorCode: "INTENT_AND_DB_ERROR",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }
    }

    const intent = intentResult.intent;
    if (!intent || typeof intent !== "string") {
      console.error(`[CHAT:${requestId}] ERROR: Invalid intent value`, { intent, type: typeof intent });
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid intent value",
          errorCode: "INTENT_INVALID_VALUE",
          session_id: conversationId,
        },
        { status: 500 }
      );
    }
    console.log(`[CHAT:${requestId}] CHECKPOINT: Intent resolved (${intent})`);
    // Reset assistant content for this request
    assistantContent = "";
    actionTaken = "general_response";
    workflowId = undefined;

    // 8. Process message based on intent
    console.log(`[CHAT:${requestId}] CHECKPOINT: Processing intent (${intent})`);
    if (intent === "create_workflow") {
      console.log(`[CHAT:${requestId}] CHECKPOINT: Handling create_workflow intent`);
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
      assistantContent =
        "I can help you create or run workflows, but workflow updates need to be done manually in the Workflows page. Would you like me to help you create a new workflow instead?";
    } else {
      // general_response
      console.log(`[CHAT:${requestId}] CHECKPOINT: Handling general_response intent`);
      actionTaken = "general_response";

      // Generate a general AI response with comprehensive context
      console.log(`[CHAT:${requestId}] CHECKPOINT: Generating AI response`);
      let generalResponseResult: any;
      try {
        // Ensure message is defined before calling generateGeneralResponse
      if (!message || typeof message !== "string") {
        throw new Error("Message is not available for AI response generation");
      }
      
      generalResponseResult = await generateGeneralResponse(
          message,
          {
            memoryContext,
            knowledgeContext,
            chatHistory: chatHistoryContext,
            workflowContext,
            executionContext,
          }
        );
        console.log(`[CHAT:${requestId}] CHECKPOINT: AI response generated`, { ok: generalResponseResult?.ok, hasResponse: !!generalResponseResult?.response, hasError: !!generalResponseResult?.error });
      } catch (aiError) {
        console.error(`[CHAT:${requestId}] ERROR: AI response generation exception`, aiError);
        generalResponseResult = {
          ok: false,
          error: aiError instanceof Error ? aiError.message : "AI response generation failed",
        };
      }

      if (generalResponseResult && generalResponseResult.ok && generalResponseResult.response) {
        if (typeof generalResponseResult.response === "string") {
          assistantContent = generalResponseResult.response;
          console.log(`[CHAT:${requestId}] CHECKPOINT: AI response content set (length: ${assistantContent.length})`);
        } else {
          console.warn(`[CHAT:${requestId}] WARNING: AI response is not a string`, typeof generalResponseResult.response);
          assistantContent = "I'm here to help with workflow automation.";
        }
      } else {
        // Enhanced error handling for AI response failures
        const errorMsg = (generalResponseResult && generalResponseResult.error) ? String(generalResponseResult.error) : "Unknown error";
        console.error(`[CHAT:${requestId}] ERROR: Failed to generate AI response`, errorMsg);
        
        // Provide user-friendly fallback message
        const errorMsgLower = errorMsg.toLowerCase();
        if (errorMsgLower.includes("api key") || 
            errorMsgLower.includes("incorrect api key") || 
            errorMsgLower.includes("invalid api key") || 
            errorMsgLower.includes("authentication")) {
          assistantContent = "I'm having trouble connecting to the AI service. Your OpenAI API key appears to be invalid or incorrect. Please check your OPENAI_API_KEY in your .env file and ensure it's a valid key from https://platform.openai.com/account/api-keys.";
        } else if (errorMsgLower.includes("rate limit") || errorMsgLower.includes("quota")) {
          assistantContent = "The AI service is currently rate-limited. Please try again in a few moments.";
        } else if (errorMsg.includes("network") || errorMsg.includes("connection")) {
          assistantContent = "I'm having trouble connecting to the AI service. Please check your internet connection and try again.";
        } else {
          assistantContent = `I encountered an error: ${errorMsg}. Please try again or contact support if the issue persists.`;
        }
        console.log(`[CHAT:${requestId}] CHECKPOINT: Using fallback error message (length: ${assistantContent.length})`);
      }
    }

    // Ensure assistantContent is set
    if (!assistantContent || typeof assistantContent !== "string") {
      console.warn(`[CHAT:${requestId}] WARNING: assistantContent is invalid, using default`, { assistantContent, type: typeof assistantContent });
      assistantContent = "I'm here to help with workflow automation.";
    }
    console.log(`[CHAT:${requestId}] CHECKPOINT: Assistant content prepared (length: ${assistantContent.length})`);

    // 9. Store memory from this interaction if it's meaningful
    if (actionTaken === "general_response" && assistantContent.length > 50) {
      // Store conversation context as memory
      try {
        // Verify prisma.memory is available before attempting to store
        if (prisma.memory) {
          // Ensure message and other required variables are available
          if (message && userId && conversationId) {
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
          ).catch((error) => {
            // Log but don't throw - memory storage is non-critical
            console.error("[CHAT] Error storing memory:", error);
          });
        } else {
          console.warn(`[CHAT:${requestId}] WARNING: Required variables not available for memory storage`, { hasMessage: !!message, hasUserId: !!userId, hasConversationId: !!conversationId });
        }
      } else {
        console.warn(`[CHAT:${requestId}] WARNING: prisma.memory is not available, skipping memory storage`);
      }
    } catch (error) {
        // Log but don't throw - memory storage is non-critical
        console.error("[CHAT] Error in memory storage block:", error);
      }
    }

    // 10. Save assistant response to chat_messages
    console.log(`[CHAT:${requestId}] CHECKPOINT: Saving assistant message to database`);
    let assistantMessage: any;
    
    // Ensure required variables are available
    if (!userId || !conversationId) {
      console.error(`[CHAT:${requestId}] ERROR: Required variables not available for assistant message`, { hasUserId: !!userId, hasConversationId: !!conversationId });
      return NextResponse.json(
        {
          ok: false,
          error: "Internal error: required context not available",
          errorCode: "MISSING_CONTEXT",
          session_id: conversationId || "unknown",
        },
        { status: 500 }
      );
    }
    
    try {
      if (!prisma || !prisma.chatMessage) {
        console.error(`[CHAT:${requestId}] ERROR: prisma.chatMessage is not available`);
        return NextResponse.json(
          {
            ok: false,
            error: "Database service unavailable",
            errorCode: "DB_UNAVAILABLE",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }

      assistantMessage = await prisma.chatMessage.create({
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

      if (!assistantMessage || !assistantMessage.id) {
        console.error(`[CHAT:${requestId}] ERROR: Failed to create assistant message - no ID returned`, assistantMessage);
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to save assistant message",
            errorCode: "DB_WRITE_ERROR",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }
      console.log(`[CHAT:${requestId}] CHECKPOINT: Assistant message saved (messageId: ${assistantMessage.id})`);
    } catch (dbError) {
      console.error(`[CHAT:${requestId}] ERROR: Database write failed for assistant message`, dbError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to save assistant message to database",
          errorCode: "DB_ERROR",
          session_id: conversationId,
        },
        { status: 500 }
      );
    }

    // 11. Fetch all messages in this conversation
    console.log(`[CHAT:${requestId}] CHECKPOINT: Fetching conversation messages`);
    let conversationMessages: any[];
    try {
      if (!prisma || !prisma.chatMessage) {
        console.error(`[CHAT:${requestId}] ERROR: prisma.chatMessage is not available for fetch`);
        return NextResponse.json(
          {
            ok: false,
            error: "Database service unavailable",
            errorCode: "DB_UNAVAILABLE",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }

      conversationMessages = await prisma.chatMessage.findMany({
        where: {
          conversation_id: conversationId,
        },
        orderBy: {
          created_at: "asc",
        },
      });

      if (!Array.isArray(conversationMessages)) {
        console.error(`[CHAT:${requestId}] ERROR: findMany returned non-array`, typeof conversationMessages);
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid conversation data",
            errorCode: "DB_FETCH_ERROR",
            session_id: conversationId,
          },
          { status: 500 }
        );
      }
      console.log(`[CHAT:${requestId}] CHECKPOINT: Conversation messages fetched (count: ${conversationMessages.length})`);
    } catch (dbError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to fetch conversation messages`, dbError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch conversation messages",
          errorCode: "DB_FETCH_ERROR",
          session_id: conversationId,
        },
        { status: 500 }
      );
    }

    // 12. Return response
    console.log(`[CHAT:${requestId}] CHECKPOINT: Preparing final response`);
    try {
      const responseData = {
        ok: true,
        session_id: conversationId,
        messages: conversationMessages.map((msg) => {
          if (!msg || typeof msg !== "object") {
            console.warn(`[CHAT:${requestId}] WARNING: Invalid message in array`, msg);
            return null;
          }
          return {
            id: msg.id || "",
            role: msg.role || "assistant",
            content: msg.content || "",
            created_at: msg.created_at || new Date(),
            metadata: msg.metadata || null,
          };
        }).filter(Boolean),
        action_taken: actionTaken,
        workflow_id: workflowId || null,
      };

      console.log(`[CHAT:${requestId}] CHECKPOINT: Returning success response`);
      return NextResponse.json(responseData, { status: 200 });
    } catch (responseError) {
      console.error(`[CHAT:${requestId}] ERROR: Failed to build response`, responseError);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to build response",
          errorCode: "RESPONSE_BUILD_ERROR",
          session_id: conversationId,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    // Use a fallback requestId if we're in the catch block (requestId may not be in scope)
    const errorRequestId = randomUUID();
    console.error(`[CHAT:${errorRequestId}] FATAL ERROR: Uncaught exception in chat handler`, error);
    logError("app/api/chat", error);
    
    // Always return valid JSON, even on fatal errors
    try {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Internal server error",
          errorCode: "FATAL_ERROR",
        },
        { status: 500 },
      );
    } catch (jsonError) {
      // If even JSON serialization fails, return minimal response
      console.error(`[CHAT:${errorRequestId}] CRITICAL: Failed to serialize error response`, jsonError);
      return new NextResponse(
        JSON.stringify({ ok: false, error: "Internal server error", errorCode: "SERIALIZATION_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
}

/**
 * Build workflow context summary for AI
 */
async function buildWorkflowContext(userId: string): Promise<string> {
  const workflows = await prisma.workflows.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      name: true,
      active: true,
    },
  });

  const activeWorkflows = workflows.filter((w) => w.active);
  const inactiveWorkflows = workflows.filter((w) => !w.active);

  // Get active skills count (skills are stored in workflows or a separate table)
  // For now, we'll skip skills as they may not be in a dedicated table
  // Note: Skills context can be added when skills table structure is finalized

  const contextParts: string[] = [];
  contextParts.push(`## WORKFLOW SUMMARY`);
  contextParts.push(`Total workflows: ${workflows.length}`);
  contextParts.push(`Active workflows: ${activeWorkflows.length}`);
  contextParts.push(`Inactive workflows: ${inactiveWorkflows.length}`);
  
  if (activeWorkflows.length > 0) {
    contextParts.push(`\nActive workflow names:`);
    activeWorkflows.slice(0, 10).forEach((w) => {
      contextParts.push(`- ${w.name} (ID: ${w.id})`);
    });
  }

      // Note: Skills context can be added when available

  return contextParts.join("\n");
}

/**
 * Build execution context summary for AI
 */
async function buildExecutionContext(userId: string): Promise<string> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalRuns24h, errorCount24h, recentExecutions] = await Promise.all([
    prisma.executions.count({
      where: {
        user_id: userId,
        created_at: { gte: last24h },
      },
    }),
    prisma.executions.count({
      where: {
        user_id: userId,
        status: { in: ["error", "failure"] },
        created_at: { gte: last24h },
      },
    }),
    prisma.executions.findMany({
      where: {
        user_id: userId,
        created_at: { gte: last24h },
      },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        status: true,
        workflow_id: true,
        workflows: {
          select: { name: true },
        },
      },
    }),
  ]);

  const successRate = totalRuns24h > 0 
    ? ((totalRuns24h - errorCount24h) / totalRuns24h * 100).toFixed(1)
    : "N/A";

  const contextParts: string[] = [];
  contextParts.push(`## EXECUTION HEALTH (Last 24h)`);
  contextParts.push(`Total runs: ${totalRuns24h}`);
  contextParts.push(`Errors: ${errorCount24h}`);
  contextParts.push(`Success rate: ${successRate}%`);

  if (recentExecutions.length > 0) {
    contextParts.push(`\nRecent executions:`);
    recentExecutions.forEach((exec) => {
      const status = exec.status === "success" ? "✓" : exec.status === "error" ? "✗" : "○";
      contextParts.push(`${status} ${exec.workflows?.name || "Unknown workflow"} - ${exec.status}`);
    });
  }

  return contextParts.join("\n");
}

/**
 * Generate a general AI response for chat
 * 
 * @param message - User's message
 * @param context - Comprehensive context object
 */
async function generateGeneralResponse(
  message: string,
  context: {
    memoryContext?: string;
    knowledgeContext?: string;
    chatHistory?: string;
    workflowContext?: string;
    executionContext?: string;
  },
): Promise<{ ok: boolean; response?: string; error?: string }> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
  const ANTHROPIC_BACKEND_API_KEY = process.env.ANTHROPIC_BACKEND_API_KEY?.trim();

  // Enhanced API key validation with helpful error messages
  if (!OPENAI_API_KEY && !ANTHROPIC_BACKEND_API_KEY) {
    console.error("[CHAT] No AI API key configured. Please set OPENAI_API_KEY or ANTHROPIC_BACKEND_API_KEY in your .env file");
    return {
      ok: false,
      error: "No AI API key configured. Please set OPENAI_API_KEY in your environment variables.",
    };
  }

  // Log which API provider is being used (without exposing the key)
  if (OPENAI_API_KEY) {
    console.log("[CHAT] Using OpenAI API for chat response");
  } else if (ANTHROPIC_BACKEND_API_KEY) {
    console.log("[CHAT] Using Anthropic API for chat response");
  }

  try {
    if (OPENAI_API_KEY) {
      console.log(`[CHAT] CHECKPOINT: Sending request to OpenAI API`);
      const requestBody = {
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  `${SYNTH_IDENTITY}

${BRANDING_INSTRUCTIONS}

## RESPONSE FORMATTING & STRUCTURE - CRITICAL

You MUST format ALL responses for maximum readability and scannability. Follow these rules in EVERY response:

### Formatting Rules (MANDATORY):
1. **Never return a single large paragraph** - Always break text into short, digestible paragraphs (1-2 sentences max)
2. **Prefer short paragraphs** - Keep paragraphs to 1-2 sentences maximum for easy scanning
3. **Use clear section headers** - When explaining multiple ideas, use headers like "## Overview", "## Next Steps", or "## Key Points"
4. **Use bullet points for lists** - When listing capabilities, options, features, or multiple items, always use bullets (-)
5. **Use numbered lists for steps** - When providing instructions or sequential actions, use numbered lists (1. 2. 3.)
6. **Add spacing between sections** - Leave blank lines between different ideas or sections for visual breathing room
7. **Highlight key terms sparingly** - Use **bold** only for important concepts or key terms, not for emphasis on every word
8. **Avoid repeating boilerplate** - Don't repeat introductory phrases unless contextually necessary
9. **Optimize for chat UI** - Responses should be scannable in a SaaS chat interface, not dense documentation

### Behavioral Guidance (Apply Based on Response Type):
- **Explaining capabilities** → Always use bullet points, never paragraphs
- **Giving steps or instructions** → Always use numbered lists (1. 2. 3.)
- **Answering a question** → Give a short 1-2 sentence summary first, then break details into sections or bullets
- **Response exceeds a few points** → Break into clear sections with headers (## Section Name)
- **Listing options or features** → Always use bullets, never inline comma-separated lists
- **Providing examples** → Put each example in its own paragraph or bullet point

### Structure Guidelines:
- **Short answers**: Start with a 1-2 sentence summary, then add details if needed
- **Long answers**: Break into clear sections with headers (## Section Name)
- **Lists**: Always use bullets (-) or numbers (1. 2. 3.) - never inline comma-separated lists
- **Multiple points**: Each major point gets its own paragraph or bullet
- **Examples**: Put examples in separate paragraphs or bullets for clarity

### Tone & Style:
- Clear and professional
- Concise but complete
- Helpful and actionable
- Premium AI assistant feel (like ChatGPT), not technical documentation
- Natural conversation flow, not robotic or templated

### Examples:

❌ BAD (wall of text):
"I can help you with workflow automation. Synth can create workflows from natural language, analyze performance, provide business advice, and integrate with hundreds of apps. You can create workflows that trigger automatically, process data, send notifications, and more."

✅ GOOD (structured):
"I can help you automate your business operations. Here's what I can do:

**Workflow Creation**
- Build complete workflows from your natural language descriptions
- No coding or technical setup required
- Automatic integration with hundreds of apps

**Business Intelligence**
- Analyze workflow performance and execution data
- Provide strategic advice based on your business context
- Identify optimization opportunities

**Automation Capabilities**
- Scheduled triggers (daily, weekly, custom)
- Event-based triggers (webhooks, API calls)
- Data processing and transformation
- Multi-channel notifications (email, Slack, SMS)"

---

You are Synth, an AI automation brain for this user's business.
You must always think in terms of workflows, skills, and automations.
You know the user's business context (from memory).
You know the current state of workflows and executions.

Your capabilities include:
- Providing strategic business advice and recommendations HEAVILY RELYING on your knowledge base
- Analyzing workflow performance, statistics, and execution results using knowledge base frameworks
- Understanding business context and applying knowledge from Synth's knowledge base
- Generating workflows from natural language informed by automation best practices from knowledge base
- Answering questions about business automation, strategy, and operations using knowledge base expertise

## KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF EXPERTISE
${context.knowledgeContext ? context.knowledgeContext : "Loading knowledge base..."}

${context.memoryContext ? `\n\n## USER MEMORY CONTEXT\n${context.memoryContext}\n\n` : ""}

${context.workflowContext ? `\n\n${context.workflowContext}\n\n` : ""}

${context.executionContext ? `\n\n${context.executionContext}\n\n` : ""}

${context.chatHistory ? `\n\n## RECENT CONVERSATION HISTORY\n${context.chatHistory}\n\n` : ""}

CRITICAL: Your knowledge base is your PRIMARY SOURCE of business expertise. You MUST:
- Heavily rely on knowledge base frameworks, principles, and methodologies when providing advice
- Reference specific knowledge base concepts when answering business questions
- Apply knowledge base best practices to all strategic recommendations
- Ground all business analysis in knowledge base principles
- Use knowledge base terminology and frameworks consistently
- Use the workflow and execution context to provide specific, actionable advice
- Reference specific workflows and their performance when relevant

## RESPONSE FORMATTING REMINDER
Remember: Every response must follow the formatting rules above. Never write walls of text. Always use:
- Short paragraphs (1-2 sentences)
- Bullets for lists and capabilities
- Numbered lists for steps
- Section headers for multiple ideas
- Proper spacing between sections

Always speak as Synth itself. You ARE Synth's intelligence. Your expertise comes from your comprehensive knowledge base combined with the user's specific business context, workflows, and execution history.`,
              },
              {
                role: "user",
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000, // Increased for more comprehensive responses
          };
      
      console.log(`[CHAT] CHECKPOINT: OpenAI request prepared`, {
        model: requestBody.model,
        messagesCount: requestBody.messages?.length,
        systemMessageLength: requestBody.messages?.[0]?.content?.length,
        userMessageLength: requestBody.messages?.[1]?.content?.length
      });

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log(`[CHAT] CHECKPOINT: OpenAI response received`, { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        // Enhanced error handling with detailed diagnostics
        let errorMessage = "Failed to generate response from OpenAI";
        let errorDetails: any = {};
        
        try {
          const errorData = await response.json();
          errorDetails = errorData;
          
          if (errorData.error?.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
            
            // Provide helpful guidance for common errors
            const errorMsgLower = errorData.error.message.toLowerCase();
            if (errorMsgLower.includes("incorrect api key") || 
                errorMsgLower.includes("invalid api key") || 
                errorMsgLower.includes("api key") && response.status === 401) {
              errorMessage = "OpenAI API key is invalid or incorrect. Please check your OPENAI_API_KEY in your .env file and ensure it's a valid key from https://platform.openai.com/account/api-keys.";
            } else if (errorMsgLower.includes("rate limit") || response.status === 429) {
              errorMessage = "OpenAI API rate limit exceeded. Please try again in a moment.";
            } else if (errorData.error.message.includes("insufficient_quota") || response.status === 429) {
              errorMessage = "OpenAI API quota exceeded. Please check your OpenAI account billing.";
            }
          } else if (errorData.error) {
            errorMessage = `OpenAI API error: ${JSON.stringify(errorData.error)}`;
          }
        } catch (parseError) {
          // If we can't parse the error, use status-based messages
          if (response.status === 401) {
            errorMessage = "OpenAI API authentication failed. Please check your OPENAI_API_KEY.";
          } else if (response.status === 429) {
            errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
          } else if (response.status >= 500) {
            errorMessage = "OpenAI API server error. Please try again in a moment.";
          } else {
            errorMessage = `OpenAI API error (status ${response.status}): ${response.statusText}`;
          }
        }
        
        console.error("[CHAT] OpenAI API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
        });
        
        return { ok: false, error: errorMessage };
      }

      console.log(`[CHAT] CHECKPOINT: Parsing OpenAI response`);
      let data: any;
      try {
        data = await response.json();
        console.log(`[CHAT] CHECKPOINT: OpenAI response parsed`, { 
          hasChoices: Array.isArray(data?.choices),
          choicesLength: data?.choices?.length,
          hasFirstChoice: !!data?.choices?.[0],
          hasMessage: !!data?.choices?.[0]?.message,
          hasContent: !!data?.choices?.[0]?.message?.content
        });
      } catch (parseError) {
        console.error(`[CHAT] ERROR: Failed to parse OpenAI response JSON`, parseError);
        return {
          ok: false,
          error: "Failed to parse AI response",
        };
      }

      // Guard against missing nested properties
      if (!data || typeof data !== "object") {
        console.error(`[CHAT] ERROR: Invalid OpenAI response data`, { type: typeof data, data });
        return {
          ok: false,
          error: "Invalid AI response format",
        };
      }

      if (!Array.isArray(data.choices) || data.choices.length === 0) {
        console.warn(`[CHAT] WARNING: OpenAI response has no choices`, { choices: data.choices });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }

      const firstChoice = data.choices[0];
      if (!firstChoice || typeof firstChoice !== "object") {
        console.warn(`[CHAT] WARNING: First choice is invalid`, { firstChoice, type: typeof firstChoice });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }

      const responseMessage = firstChoice.message;
      if (!responseMessage || typeof responseMessage !== "object") {
        console.warn(`[CHAT] WARNING: Message is invalid`, { responseMessage, type: typeof responseMessage });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }

      const content = responseMessage.content;
      if (typeof content === "string" && content.length > 0) {
        console.log(`[CHAT] CHECKPOINT: OpenAI content extracted (length: ${content.length})`);
        return {
          ok: true,
          response: content,
        };
      } else {
        console.warn(`[CHAT] WARNING: Content is invalid or empty`, { content, type: typeof content });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }
    } else if (ANTHROPIC_BACKEND_API_KEY) {
      console.log(`[CHAT] CHECKPOINT: Sending request to Anthropic API`);
      const requestBody = {
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000, // Increased for more comprehensive responses
          system:
            `${SYNTH_IDENTITY}

${BRANDING_INSTRUCTIONS}

You are Synth, an AI automation brain for this user's business.
You must always think in terms of workflows, skills, and automations.
You know the user's business context (from memory).
You know the current state of workflows and executions.

Your capabilities include:
- Providing strategic business advice and recommendations HEAVILY RELYING on your knowledge base
- Analyzing workflow performance, statistics, and execution results using knowledge base frameworks
- Understanding business context and applying knowledge from Synth's knowledge base
- Generating workflows from natural language informed by automation best practices from knowledge base
- Answering questions about business automation, strategy, and operations using knowledge base expertise

## KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF EXPERTISE
${context.knowledgeContext ? context.knowledgeContext : "Loading knowledge base..."}

${context.memoryContext ? `\n\n## USER MEMORY CONTEXT\n${context.memoryContext}\n\n` : ""}

${context.workflowContext ? `\n\n${context.workflowContext}\n\n` : ""}

${context.executionContext ? `\n\n${context.executionContext}\n\n` : ""}

${context.chatHistory ? `\n\n## RECENT CONVERSATION HISTORY\n${context.chatHistory}\n\n` : ""}

CRITICAL: Your knowledge base is your PRIMARY SOURCE of business expertise. You MUST:
- Heavily rely on knowledge base frameworks, principles, and methodologies when providing advice
- Reference specific knowledge base concepts when answering business questions
- Apply knowledge base best practices to all strategic recommendations
- Ground all business analysis in knowledge base principles
- Use knowledge base terminology and frameworks consistently
- Use the workflow and execution context to provide specific, actionable advice
- Reference specific workflows and their performance when relevant

Always speak as Synth itself. You ARE Synth's intelligence. Your expertise comes from your comprehensive knowledge base combined with the user's specific business context, workflows, and execution history.`,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        };
      
      console.log(`[CHAT] CHECKPOINT: Anthropic request prepared`, {
        model: requestBody.model,
        systemLength: requestBody.system?.length,
        messagesCount: requestBody.messages?.length,
        userMessageLength: requestBody.messages?.[0]?.content?.length
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_BACKEND_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[CHAT] CHECKPOINT: Anthropic response received`, { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
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

      console.log(`[CHAT] CHECKPOINT: Parsing Anthropic response`);
      let data: any;
      try {
        data = await response.json();
        console.log(`[CHAT] CHECKPOINT: Anthropic response parsed`, {
          hasContent: Array.isArray(data?.content),
          contentLength: data?.content?.length,
          hasFirstContent: !!data?.content?.[0],
          hasText: !!data?.content?.[0]?.text
        });
      } catch (parseError) {
        console.error(`[CHAT] ERROR: Failed to parse Anthropic response JSON`, parseError);
        return {
          ok: false,
          error: "Failed to parse AI response",
        };
      }

      // Guard against missing nested properties
      if (!data || typeof data !== "object") {
        console.error(`[CHAT] ERROR: Invalid Anthropic response data`, { type: typeof data, data });
        return {
          ok: false,
          error: "Invalid AI response format",
        };
      }

      if (!Array.isArray(data.content) || data.content.length === 0) {
        console.warn(`[CHAT] WARNING: Anthropic response has no content`, { content: data.content });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }

      const firstContent = data.content[0];
      if (!firstContent || typeof firstContent !== "object") {
        console.warn(`[CHAT] WARNING: First content is invalid`, { firstContent, type: typeof firstContent });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }

      const text = firstContent.text;
      if (typeof text === "string" && text.length > 0) {
        console.log(`[CHAT] CHECKPOINT: Anthropic text extracted (length: ${text.length})`);
        return {
          ok: true,
          response: text,
        };
      } else {
        console.warn(`[CHAT] WARNING: Text is invalid or empty`, { text, type: typeof text });
        return {
          ok: true,
          response: "I'm here to help with workflow automation.",
        };
      }
    }
  } catch (error: unknown) {
    // Enhanced error logging with connection diagnostics
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CHAT] Error generating AI response:", {
      error: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error,
      hasOpenAIKey: !!OPENAI_API_KEY,
      hasAnthropicKey: !!ANTHROPIC_BACKEND_API_KEY,
    });
    
    logError("app/api/chat (generateGeneralResponse)", error);
    
    // Provide user-friendly error messages
    if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("network")) {
      return {
        ok: false,
        error: "Network error connecting to AI service. Please check your internet connection and try again.",
      };
    }
    
    return {
      ok: false,
      error: errorMessage || "Failed to generate response. Please try again.",
    };
  }

  return {
    ok: false,
    error: "No AI provider available",
  };
}

