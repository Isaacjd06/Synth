import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import type { Skill } from "@/types/api";

/**
 * GET /api/skills
 * 
 * Returns all prebuilt skills for the authenticated user.
 * Skills are workflows with a special category or created_by_ai flag.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // For now, skills are workflows that are created_by_ai or have a specific pattern
    // In the future, this could be a separate table or flag
    const skillWorkflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        created_by_ai: true, // Skills are AI-created workflows
      },
      select: {
        id: true,
        name: true,
        description: true,
        intent: true,
        active: true,
        created_at: true,
      },
    });

    // Get execution counts for each skill
    const skillsWithCounts: Skill[] = await Promise.all(
      skillWorkflows.map(async (workflow) => {
        const executionCount = await prisma.executions.count({
          where: {
            workflow_id: workflow.id,
          },
        });

        // Determine required plan based on skill complexity
        // This is a placeholder - in production, this would come from skill metadata
        let requiredPlan: "starter" | "pro" | "agency" = "starter";
        if (workflow.name.toLowerCase().includes("document") || 
            workflow.name.toLowerCase().includes("meeting")) {
          requiredPlan = "pro";
        } else if (workflow.name.toLowerCase().includes("support") ||
                   workflow.name.toLowerCase().includes("ticket")) {
          requiredPlan = "agency";
        }

        // Extract steps preview from intent or description
        const stepsPreview = workflow.intent || workflow.description || "No preview available";

        return {
          id: workflow.id,
          name: workflow.name,
          category: "Productivity", // Placeholder - could be extracted from metadata
          description: workflow.description || "No description",
          stepsPreview,
          active: workflow.active,
          executionCount,
          requiredPlan,
        };
      })
    );

    // Return array directly to match UI expectations
    return NextResponse.json(skillsWithCounts, { status: 200 });
  } catch (err) {
    console.error("SKILLS LIST ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

