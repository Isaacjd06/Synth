import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Type definitions
interface CreateUserBody {
  email?: string;
  name?: string;
}

interface UpdateUserBody {
  email?: string;
  name?: string;
}

// GET - Fetch all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserBody = await request.json();

    // Validate required fields (email is optional in schema, but you can enforce it here if needed)
    if (!body.email && !body.name) {
      return NextResponse.json(
        { success: false, error: "At least email or name is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/users error:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT - Update a user by id
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateUserBody & { id: string } = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: body.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = await prisma.user.update({
      where: { id: body.id },
      data: {
        email: body.email,
        name: body.name,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("PUT /api/users error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
