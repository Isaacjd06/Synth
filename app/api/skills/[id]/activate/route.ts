import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { getEffectiveSubscriptionPlan, requireSubscriptionLevel } from "@/lib/subscription";

/**
 * PATCH /api/skills/[id]/activate
 * 
 * Activates a skill (workflow).
 * FREE plan cannot activate skills.
 * STARTER+ can activate skills if they have the required plan level.
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
        created_by_ai: true, // Only skills can be activated this way
      },
    });

    if (!workflow) {
      return error("Skill not found", { status: 404 });
    }

    // Determine required plan for this skill
    // This is a placeholder - in production, this would come from skill metadata
    let requiredPlan: "starter" | "pro" | "agency" = "starter";
    if (workflow.name.toLowerCase().includes("document") || 
        workflow.name.toLowerCase().includes("meeting")) {
      requiredPlan = "pro";
    } else if (workflow.name.toLowerCase().includes("support") ||
               workflow.name.toLowerCase().includes("ticket")) {
      requiredPlan = "agency";
    }

    // Check if user has required plan
    const planCheck = await requireSubscriptionLevel(userId, requiredPlan);
    if (planCheck) {
      return planCheck;
    }

    // Activate the workflow
    const updated = await prisma.workflows.update({
      where: { id },
      data: { active: true },
    });

    return success({ id: updated.id, active: updated.active });
  } catch (err) {
    console.error("SKILL ACTIVATE ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

