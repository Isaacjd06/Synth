import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";

/**
 * PATCH /api/skills/[id]/deactivate
 * 
 * Deactivates a skill (workflow).
 * Requires subscription.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const { id } = await params;

    // Get the skill/workflow
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: userId,
        created_by_ai: true,
      },
    });

    if (!workflow) {
      return error("Skill not found", { status: 404 });
    }

    // Deactivate the workflow
    const updated = await prisma.workflows.update({
      where: { id },
      data: { active: false },
    });

    return success({ id: updated.id, active: updated.active });
  } catch (err) {
    console.error("SKILL DEACTIVATE ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

