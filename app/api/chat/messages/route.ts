import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const GetMessagesRequestSchema = z.object({
  conversation_id: z.string().min(1, "Conversation ID is required"),
});

/**
 * GET /api/chat/messages?conversation_id=...
 * 
 * Fetches all messages for a conversation.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have valid subscription
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user and check subscription
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    // 3. Parse query parameters
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "conversation_id query parameter is required" },
        { status: 400 }
      );
    }

    // 4. Fetch messages from database
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversation_id: conversationId,
        user_id: userId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // 5. Return messages
    return NextResponse.json(
      {
        ok: true,
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
          metadata: msg.metadata,
        })),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET MESSAGES ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

