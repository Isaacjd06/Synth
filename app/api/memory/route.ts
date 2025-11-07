import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Type definitions
interface CreateMemoryBody {
  user_id: string;
  key: string;
  value?: any;
}

interface UpdateMemoryBody {
  id: string;
  key?: string;
  value?: any;
}

// GET - Fetch all memory entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const key = searchParams.get("key");

    // Build where clause for filtering
    const where: any = {};
    if (userId) where.user_id = userId;
    if (key) where.key = key;

    const memory = await prisma.memory.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { created_at: "desc" },
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

    return NextResponse.json({ success: true, data: memory });
  } catch (error) {
    console.error("GET /api/memory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch memory" },
      { status: 500 }
    );
  }
}

// POST - Create a new memory entry
export async function POST(request: NextRequest) {
  try {
    const body: CreateMemoryBody = await request.json();

    // Validate required fields
    if (!body.user_id || !body.key) {
      return NextResponse.json(
        { success: false, error: "user_id and key are required" },
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

    const memory = await prisma.memory.create({
      data: {
        user_id: body.user_id,
        key: body.key,
        value: body.value,
      },
    });

    return NextResponse.json({ success: true, data: memory }, { status: 201 });
  } catch (error) {
    console.error("POST /api/memory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create memory" },
      { status: 500 }
    );
  }
}

// PUT - Update a memory entry by id
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateMemoryBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Memory ID is required" },
        { status: 400 }
      );
    }

    // Check if memory exists
    const existingMemory = await prisma.memory.findUnique({
      where: { id: body.id },
    });

    if (!existingMemory) {
      return NextResponse.json(
        { success: false, error: "Memory not found" },
        { status: 404 }
      );
    }

    const memory = await prisma.memory.update({
      where: { id: body.id },
      data: {
        key: body.key,
        value: body.value,
      },
    });

    return NextResponse.json({ success: true, data: memory });
  } catch (error) {
    console.error("PUT /api/memory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update memory" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a memory entry by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Memory ID is required" },
        { status: 400 }
      );
    }

    // Check if memory exists
    const existingMemory = await prisma.memory.findUnique({
      where: { id },
    });

    if (!existingMemory) {
      return NextResponse.json(
        { success: false, error: "Memory not found" },
        { status: 404 }
      );
    }

    await prisma.memory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/memory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
