import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";

/**
 * POST /api/skills/create
 * 
 * Creates a new skill (workflow with created_by_ai flag).
 */
export async function POST(request: Request) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    const body = await request.json();
    const { name, category, description, longDescription, actionsDescription, triggerType } = body;

    // Validate required fields
    if (!name || !category || !description) {
      return error("Missing required fields: name, category, and description are required", {
        status: 400,
      });
    }

    // Validate category
    const validCategories = ["Sales", "Productivity", "Operations", "Communication", "Support"];
    if (!validCategories.includes(category)) {
      return error(`Invalid category. Must be one of: ${validCategories.join(", ")}`, {
        status: 400,
      });
    }

    // Create workflow with skill metadata
    // Skills are workflows with created_by_ai flag set to true
    // Store category and metadata in intent as JSON for retrieval
    const intentData = {
      category,
      actionsDescription: actionsDescription?.trim() || description.trim(),
      longDescription: longDescription?.trim() || description.trim(),
    };

    const workflow = await prisma.workflows.create({
      data: {
        user_id: userId,
        name: name.trim(),
        description: description.trim(),
        intent: JSON.stringify(intentData), // Store category and metadata in intent as JSON
        created_by_ai: true,
        active: false, // Skills are inactive by default
        trigger: triggerType === "manual" 
          ? { type: "manual", config: {} }
          : { type: "manual", config: {} }, // Default to manual for now
        actions: {}, // Actions will be configured later
      },
    });

    // Return the created skill
    return success({
      id: workflow.id,
      name: workflow.name,
      category,
      description: workflow.description || "",
      stepsPreview: intentData.actionsDescription,
      active: workflow.active,
      executionCount: 0,
      requiredPlan: "starter", // Default plan requirement
    });
  } catch (err) {
    console.error("CREATE SKILL ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

