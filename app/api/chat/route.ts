import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Type definitions
interface CreateChatMessageBody {
  user_id: string;
  session_id?: string;
  role: string;
  message: string;
}

interface UpdateChatMessageBody {
  id: string;
  session_id?: string;
  role?: string;
  message?: string;
}

// GET - Fetch all chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const sessionId = searchParams.get("session_id");

    // Build where clause for filtering
    const where: any = {};
    if (userId) where.user_id = userId;
    if (sessionId) where.session_id = sessionId;

    const chatMessages = await prisma.chatMessage.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { created_at: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: chatMessages });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST - Create a new chat message
export async function POST(request: NextRequest) {
  try {
    const body: CreateChatMessageBody = await request.json();

    // Validate required fields
    if (!body.user_id || !body.role || !body.message) {
      return NextResponse.json(
        { success: false, error: "user_id, role, and message are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.user_id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        user_id: body.user_id,
        session_id: body.session_id,
        role: body.role,
        message: body.message,
      },
    });

    return NextResponse.json({ success: true, data: chatMessage }, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create chat message" },
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
        session_id: body.session_id,
        role: body.role,
        message: body.message,
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
