import { NextRequest, NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateKnowledgeItemSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["text", "markdown", "url", "file", "structured_doc"]).optional(),
  content: z.string().optional(),
  file_url: z.string().url().optional(),
  file_type: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * PUT /api/knowledge/[id]
 *
 * Update a knowledge item.
 * Requires full access (paid or trial).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id } = await params;

    // Verify the knowledge item belongs to the user
    const existingItem = await prisma.knowledge.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { ok: false, error: "Knowledge item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = UpdateKnowledgeItemSchema.safeParse(body);

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

    const updatedItem = await prisma.knowledge.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.file_url !== undefined && { file_url: data.file_url }),
        ...(data.file_type !== undefined && { file_type: data.file_type }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });

    return NextResponse.json({
      ok: true,
      item: updatedItem,
    });
  } catch (error: unknown) {
    console.error("PUT /api/knowledge/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

