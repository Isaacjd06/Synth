import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateRuleSchema = z.object({
  content: z.string().min(1, "Rule content is required"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

const UpdateRuleSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

/**
 * GET /api/knowledge/business-rules
 * List all business rules for the authenticated user
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const rules = await prisma.business_rules.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      rules: rules.map((rule) => ({
        id: rule.id,
        content: rule.content,
        priority: rule.priority,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
      })),
    });
  } catch (error: unknown) {
    console.error("BUSINESS RULES GET ERROR:", error);
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
 * POST /api/knowledge/business-rules
 * Create a new business rule
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = CreateRuleSchema.safeParse(body);

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

    const { content, priority } = validationResult.data;

    const rule = await prisma.business_rules.create({
      data: {
        user_id: userId,
        content,
        priority,
      },
    });

    return NextResponse.json({
      ok: true,
      rule: {
        id: rule.id,
        content: rule.content,
        priority: rule.priority,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
      },
    });
  } catch (error: unknown) {
    console.error("BUSINESS RULES POST ERROR:", error);
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
 * PUT /api/knowledge/business-rules
 * Update an existing business rule
 */
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = UpdateRuleSchema.safeParse(body);

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

    const { id, content, priority } = validationResult.data;

    // Verify rule belongs to user
    const existing = await prisma.business_rules.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    const rule = await prisma.business_rules.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
      },
    });

    return NextResponse.json({
      ok: true,
      rule: {
        id: rule.id,
        content: rule.content,
        priority: rule.priority,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
      },
    });
  } catch (error: unknown) {
    console.error("BUSINESS RULES PUT ERROR:", error);
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
 * DELETE /api/knowledge/business-rules
 * Delete a business rule
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
        { ok: false, error: "Rule ID is required" },
        { status: 400 }
      );
    }

    // Verify rule belongs to user
    const existing = await prisma.business_rules.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    await prisma.business_rules.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Rule deleted successfully",
    });
  } catch (error: unknown) {
    console.error("BUSINESS RULES DELETE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

