import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Type definitions
interface CreateConnectionBody {
  user_id: string;
  service_name: string;
  credentials?: any;
}

interface UpdateConnectionBody {
  id: string;
  service_name?: string;
  credentials?: any;
}

// GET - Fetch all connections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    // Filter by user_id if provided
    const connections = await prisma.connection.findMany({
      where: userId ? { user_id: userId } : undefined,
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

    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    console.error("GET /api/connections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

// POST - Create a new connection
export async function POST(request: NextRequest) {
  try {
    const body: CreateConnectionBody = await request.json();

    // Validate required fields
    if (!body.user_id || !body.service_name) {
      return NextResponse.json(
        { success: false, error: "user_id and service_name are required" },
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

    const connection = await prisma.connection.create({
      data: {
        user_id: body.user_id,
        service_name: body.service_name,
        credentials: body.credentials,
      },
    });

    return NextResponse.json({ success: true, data: connection }, { status: 201 });
  } catch (error) {
    console.error("POST /api/connections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create connection" },
      { status: 500 }
    );
  }
}

// PUT - Update a connection by id
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateConnectionBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Check if connection exists
    const existingConnection = await prisma.connection.findUnique({
      where: { id: body.id },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { success: false, error: "Connection not found" },
        { status: 404 }
      );
    }

    const connection = await prisma.connection.update({
      where: { id: body.id },
      data: {
        service_name: body.service_name,
        credentials: body.credentials,
      },
    });

    return NextResponse.json({ success: true, data: connection });
  } catch (error) {
    console.error("PUT /api/connections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update connection" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a connection by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Check if connection exists
    const existingConnection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { success: false, error: "Connection not found" },
        { status: 404 }
      );
    }

    await prisma.connection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/connections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
