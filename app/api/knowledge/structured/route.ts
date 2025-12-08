import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StructuredDataSchema = z.object({
  type: z.enum(["company_info", "product", "team_member", "tool"]),
  data: z.record(z.unknown()),
});

const UpdateStructuredSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["company_info", "product", "team_member", "tool"]),
  data: z.record(z.unknown()),
});

/**
 * GET /api/knowledge/structured
 * Get all structured knowledge for the authenticated user
 */
export async function GET(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "company_info" | "product" | "team_member" | "tool" | null;

    const where: { user_id: string; type?: string } = {
      user_id: userId,
    };

    if (type) {
      where.type = type;
    }

    const items = await prisma.structured_knowledge.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        data: item.data,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error: unknown) {
    console.error("STRUCTURED KNOWLEDGE GET ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/structured
 * Create or update structured knowledge
 * If multiple items of same type are sent, they will be created as separate entries
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    
    // Handle both single item and array of items
    const items = Array.isArray(body) ? body : [body];
    
    const results = [];
    const errors = [];

    for (const item of items) {
      const validationResult = StructuredDataSchema.safeParse(item);

      if (!validationResult.success) {
        errors.push({
          item,
          error: "Invalid request body",
          details: validationResult.error.issues,
        });
        continue;
      }

      const { type, data } = validationResult.data;

      try {
        const created = await prisma.structured_knowledge.create({
          data: {
            user_id: userId,
            type,
            data,
          },
        });

        results.push({
          id: created.id,
          type: created.type,
          data: created.data,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        });
      } catch (error) {
        errors.push({
          item,
          error: error instanceof Error ? error.message : "Failed to create",
        });
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      items: results,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error: unknown) {
    console.error("STRUCTURED KNOWLEDGE POST ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge/structured
 * Update structured knowledge
 */
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = UpdateStructuredSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, type, data } = validationResult.data;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID is required for update" },
        { status: 400 }
      );
    }

    // Verify item belongs to user
    const existing = await prisma.structured_knowledge.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.structured_knowledge.update({
      where: { id },
      data: {
        type,
        data,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        id: updated.id,
        type: updated.type,
        data: updated.data,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error: unknown) {
    console.error("STRUCTURED KNOWLEDGE PUT ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge/structured
 * Delete structured knowledge
 */
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify item belongs to user
    const existing = await prisma.structured_knowledge.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Item not found" },
        { status: 404 }
      );
    }

    await prisma.structured_knowledge.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Item deleted successfully",
    });
  } catch (error: unknown) {
    console.error("STRUCTURED KNOWLEDGE DELETE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

