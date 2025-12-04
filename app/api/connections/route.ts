import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

// Type definitions
interface CreateConnectionBody {
  user_id: string;
  service_name: string;
  status?: string; // "active" | "inactive"
  connection_type?: string; // "OAuth" | "APIKey"
  // SECURITY: Secrets are NOT stored in database
}

interface UpdateConnectionBody {
  id: string;
  service_name?: string;
  status?: string;
  connection_type?: string;
  // SECURITY: Secrets are NOT stored in database
}

// GET - Fetch all connections
export async function GET(request: NextRequest) {
  try {
    // Always enforce SYSTEM_USER_ID scope - ignore user_id query param
    const connections = await prisma.connection.findMany({
      where: {
        user_id: SYSTEM_USER_ID, // Security scope check - only return connections for system user
      },
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
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

// POST - Create a new connection
export async function POST(request: NextRequest) {
  try {
    const body: CreateConnectionBody = await request.json();

    // Validate required fields
    if (!body.service_name) {
      return NextResponse.json(
        { error: "service_name is required" },
        { status: 400 }
      );
    }

    // Enforce SYSTEM_USER_ID - ignore user_id from request body
    // This prevents users from creating connections for other users
    // SECURITY: Do not store credentials in database
    // Credentials (OAuth tokens, API keys) must be stored in secure storage system
    // This endpoint only stores connection metadata

    const connection = await prisma.connection.create({
      data: {
        user_id: SYSTEM_USER_ID, // Always use SYSTEM_USER_ID, ignore body.user_id
        service_name: body.service_name,
        status: body.status || "active",
        connection_type: body.connection_type || null,
        last_verified: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: connection }, { status: 201 });
  } catch (error) {
    console.error("POST /api/connections error:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
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
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Check if connection exists and belongs to system user
    const existingConnection = await prisma.connection.findFirst({
      where: {
        id: body.id,
        user_id: SYSTEM_USER_ID, // Security scope check
      },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // SECURITY: Do not update credentials in database
    // Credentials must be updated in secure storage system separately

    const connection = await prisma.connection.update({
      where: { id: body.id },
      data: {
        service_name: body.service_name,
        status: body.status,
        connection_type: body.connection_type,
        // Update last_verified when status changes
        ...(body.status && { last_verified: new Date() }),
      },
    });

    return NextResponse.json({ success: true, data: connection });
  } catch (error) {
    console.error("PUT /api/connections error:", error);
    return NextResponse.json(
      { error: "Failed to update connection" },
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
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Check if connection exists and belongs to system user
    const existingConnection = await prisma.connection.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID, // Security scope check
      },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // SECURITY: When deleting connection, also delete secrets from secure storage
    // This is handled by the secure storage system, not this endpoint

    await prisma.connection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/connections error:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
