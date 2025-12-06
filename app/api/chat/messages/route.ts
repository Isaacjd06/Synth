import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

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
 * - User must be the admin user (SYSTEM_USER_ID)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate admin user
    if (session.user.id !== SYSTEM_USER_ID) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

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
        user_id: session.user.id,
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
  } catch (error: any) {
    console.error("GET MESSAGES ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

