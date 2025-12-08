import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateGlossarySchema = z.object({
  term: z.string().min(1, "Term is required"),
  definition: z.string().min(1, "Definition is required"),
});

const UpdateGlossarySchema = z.object({
  id: z.string().uuid(),
  term: z.string().min(1).optional(),
  definition: z.string().min(1).optional(),
});

/**
 * GET /api/knowledge/glossary
 * List all glossary entries for the authenticated user
 */
export async function GET(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: { user_id: string; term?: { contains: string; mode?: "insensitive" } } = {
      user_id: userId,
    };

    if (search) {
      where.term = {
        contains: search,
        mode: "insensitive",
      };
    }

    const entries = await prisma.glossary.findMany({
      where,
      orderBy: { term: "asc" },
    });

    return NextResponse.json({
      ok: true,
      entries: entries.map((entry) => ({
        id: entry.id,
        term: entry.term,
        definition: entry.definition,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      })),
    });
  } catch (error: unknown) {
    console.error("GLOSSARY GET ERROR:", error);
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
 * POST /api/knowledge/glossary
 * Create a new glossary entry
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = CreateGlossarySchema.safeParse(body);

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

    const { term, definition } = validationResult.data;

    // Check if term already exists for this user
    const existing = await prisma.glossary.findUnique({
      where: {
        user_id_term: {
          user_id: userId,
          term: term.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: "Term already exists",
        },
        { status: 409 }
      );
    }

    const entry = await prisma.glossary.create({
      data: {
        user_id: userId,
        term: term.trim(),
        definition: definition.trim(),
      },
    });

    return NextResponse.json({
      ok: true,
      entry: {
        id: entry.id,
        term: entry.term,
        definition: entry.definition,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      },
    });
  } catch (error: unknown) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Term already exists",
        },
        { status: 409 }
      );
    }

    console.error("GLOSSARY POST ERROR:", error);
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
 * PUT /api/knowledge/glossary
 * Update an existing glossary entry
 */
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = UpdateGlossarySchema.safeParse(body);

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

    const { id, term, definition } = validationResult.data;

    // Verify entry belongs to user
    const existing = await prisma.glossary.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Entry not found" },
        { status: 404 }
      );
    }

    // If term is being updated, check for conflicts
    if (term && term.trim() !== existing.term) {
      const conflict = await prisma.glossary.findUnique({
        where: {
          user_id_term: {
            user_id: userId,
            term: term.trim(),
          },
        },
      });

      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          {
            ok: false,
            error: "Term already exists",
          },
          { status: 409 }
        );
      }
    }

    const entry = await prisma.glossary.update({
      where: { id },
      data: {
        ...(term !== undefined && { term: term.trim() }),
        ...(definition !== undefined && { definition: definition.trim() }),
      },
    });

    return NextResponse.json({
      ok: true,
      entry: {
        id: entry.id,
        term: entry.term,
        definition: entry.definition,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      },
    });
  } catch (error: unknown) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Term already exists",
        },
        { status: 409 }
      );
    }

    console.error("GLOSSARY PUT ERROR:", error);
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
 * DELETE /api/knowledge/glossary
 * Delete a glossary entry
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
        { ok: false, error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Verify entry belongs to user
    const existing = await prisma.glossary.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Entry not found" },
        { status: 404 }
      );
    }

    await prisma.glossary.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Entry deleted successfully",
    });
  } catch (error: unknown) {
    console.error("GLOSSARY DELETE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

