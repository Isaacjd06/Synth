import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const KnowledgeItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["text", "markdown", "url", "file", "structured_doc"]).optional().default("text"),
  content: z.string().optional(),
  file_url: z.string().url().optional(),
  file_type: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/knowledge
 * 
 * List all knowledge items for the authenticated user.
 * Unpaid users can view but not create/edit knowledge.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const knowledgeItems = await prisma.knowledge.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      items: knowledgeItems,
    });
  } catch (error: unknown) {
    console.error("GET /api/knowledge error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge
 * 
 * Create a new knowledge item.
 * Requires full access (paid or trial).
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await request.json();
    const validationResult = KnowledgeItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate based on type
    if (data.type === "url" && !data.content && !data.file_url) {
      return NextResponse.json(
        { ok: false, error: "URL is required for url type knowledge" },
        { status: 400 }
      );
    }

    if (data.type === "file" && !data.file_url) {
      return NextResponse.json(
        { ok: false, error: "file_url is required for file type knowledge" },
        { status: 400 }
      );
    }

    if ((data.type === "text" || data.type === "markdown") && !data.content) {
      return NextResponse.json(
        { ok: false, error: "content is required for text/markdown type knowledge" },
        { status: 400 }
      );
    }

    const knowledgeItem = await prisma.knowledge.create({
      data: {
        user_id: userId,
        title: data.title,
        type: data.type,
        content: data.content,
        file_url: data.file_url,
        file_type: data.file_type,
        metadata: data.metadata || {},
      },
    });

    return NextResponse.json(
      {
        ok: true,
        item: knowledgeItem,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/knowledge error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge?id=<knowledge_id>
 * 
 * Delete a knowledge item.
 * Requires full access (paid or trial).
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Knowledge item ID is required" },
        { status: 400 }
      );
    }

    // Verify the knowledge item belongs to the user
    const knowledgeItem = await prisma.knowledge.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!knowledgeItem) {
      return NextResponse.json(
        { ok: false, error: "Knowledge item not found" },
        { status: 404 }
      );
    }

    await prisma.knowledge.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Knowledge item deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/knowledge error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

