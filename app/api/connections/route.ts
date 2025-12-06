import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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
// Unpaid users can view connections
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const connections = await prisma.connection.findMany({
      where: {
        user_id: userId,
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
      { status: 500 },
    );
  }
}

// POST - Create a new connection
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body: CreateConnectionBody = await request.json();

    // Validate required fields
    if (!body.service_name) {
      return NextResponse.json(
        { error: "service_name is required" },
        { status: 400 },
      );
    }

    // Use authenticated user ID - ignore user_id from request body
    // This prevents users from creating connections for other users
    // SECURITY: Do not store credentials in database
    // Credentials (OAuth tokens, API keys) must be stored in secure storage system
    // This endpoint only stores connection metadata

    const connection = await prisma.connection.create({
      data: {
        user_id: userId,
        service_name: body.service_name,
        status: body.status || "active",
        connection_type: body.connection_type || null,
        last_verified: new Date(),
      },
    });

    // Log audit event
    await logAudit("connection.create", userId, {
      connection_id: connection.id,
      service_name: connection.service_name,
      connection_type: connection.connection_type,
    });

    return NextResponse.json(
      { success: true, data: connection },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/connections error:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 },
    );
  }
}

// PUT - Update a connection by id
// Requires full access - unpaid users cannot update connections
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body: UpdateConnectionBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 },
      );
    }

    // Check if connection exists and belongs to user
    const existingConnection = await prisma.connection.findFirst({
      where: {
        id: body.id,
        user_id: userId,
      },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}

// DELETE - Delete a connection by id
// Unpaid users can remove connections
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 },
      );
    }

    // Check if connection exists and belongs to user
    const existingConnection = await prisma.connection.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingConnection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 },
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
      { status: 500 },
    );
  }
}
