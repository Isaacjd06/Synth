import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Type definitions
interface CreateChatMessageBody {
  user_id: string;
  conversation_id?: string;
  role: string;
  content: string;
  metadata?: any;
}

interface UpdateChatMessageBody {
  id: string;
  conversation_id?: string;
  role?: string;
  content?: string;
  metadata?: any;
}

// GET - Fetch all chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const conversationId = searchParams.get("conversation_id");

    // Build where clause for filtering
    const where: any = {};
    if (userId) where.user_id = userId;
    if (conversationId) where.conversation_id = conversationId;

    // Always filter by user_id if provided, otherwise return empty array for safety
    if (!userId) {
      console.warn("GET /api/chat: No user_id provided, returning empty array");
      return NextResponse.json({ success: true, data: [] });
    }

    const chatMessages = await prisma.chatMessage.findMany({
      where: where,
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        user_id: true,
        role: true,
        content: true,
        conversation_id: true,
        created_at: true,
        metadata: true,
      },
    });

    return NextResponse.json({ success: true, data: chatMessages });
  } catch (error: any) {
    console.error("GET /api/chat error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch chat messages",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new chat message
export async function POST(request: NextRequest) {
  try {
    const body: CreateChatMessageBody = await request.json();

    // Validate required fields
    if (!body.user_id || !body.role || !body.content) {
      return NextResponse.json(
        { success: false, error: "user_id, role, and content are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.user_id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Please ensure the user exists in the database." },
        { status: 404 }
      );
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        user_id: body.user_id,
        conversation_id: body.conversation_id || null,
        role: body.role,
        content: body.content,
        metadata: body.metadata || null,
      },
    });

    return NextResponse.json({ success: true, data: chatMessage }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to create chat message",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update a chat message by id
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateChatMessageBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id: body.id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    const chatMessage = await prisma.chatMessage.update({
      where: { id: body.id },
      data: {
        conversation_id: body.conversation_id,
        role: body.role,
        content: body.content,
        metadata: body.metadata,
      },
    });

    return NextResponse.json({ success: true, data: chatMessage });
  } catch (error) {
    console.error("PUT /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chat message" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat message by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Check if message exists
    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    await prisma.chatMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete chat message" },
      { status: 500 }
    );
  }
}
