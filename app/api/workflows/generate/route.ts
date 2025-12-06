import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWorkflowBlueprint } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { createWorkflow, PipedreamError } from "@/lib/pipedream";
import { z } from "zod";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

const GenerateRequestSchema = z.object({
  intent: z.string().min(1, "Intent is required"),
});

/**
 * POST /api/workflows/generate
 * 
 * Generates a workflow blueprint from natural language intent using AI
 * and stores it in the database.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be the admin user (SYSTEM_USER_ID)
 * - Request body must contain { intent: string }
 * 
 * Returns the created workflow object with ID and blueprint.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate admin user
    if (session.user.id !== SYSTEM_USER_ID) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validationResult = GenerateRequestSchema.safeParse(body);

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

    const { intent } = validationResult.data;

    // 4. Generate workflow blueprint using AI
    const aiResult = await generateWorkflowBlueprint(intent);

    if (!aiResult.ok) {
      return NextResponse.json(
        { ok: false, error: aiResult.error },
        { status: 500 }
      );
    }

    const blueprint = aiResult.blueprint;

    // 5. Store workflow blueprint in database
    const workflow = await prisma.workflows.create({
      data: {
        user_id: session.user.id,
        name: blueprint.name,
        description: blueprint.description || null,
        intent: intent,
        trigger: blueprint.trigger as any, // Store as JSON
        actions: blueprint.actions as any, // Store as JSON
        active: true,
      },
    });

    // 6. Create workflow in Pipedream
    let pipedreamWorkflowId: string | null = null;
    let pipedreamError: string | null = null;

    try {
      const pipedreamResult = await createWorkflow(blueprint);
      pipedreamWorkflowId = pipedreamResult.pipedream_workflow_id;

      // Update workflow with Pipedream ID
      const updatedWorkflow = await prisma.workflows.update({
        where: { id: workflow.id },
        data: {
          n8n_workflow_id: pipedreamWorkflowId, // Using n8n_workflow_id field to store Pipedream ID
        },
      });

      // 7. Return the created workflow object with Pipedream ID
      return NextResponse.json(
        {
          ok: true,
          workflow: {
            id: updatedWorkflow.id,
            name: updatedWorkflow.name,
            description: updatedWorkflow.description,
            intent: updatedWorkflow.intent,
            trigger: updatedWorkflow.trigger,
            actions: updatedWorkflow.actions,
            active: updatedWorkflow.active,
            n8n_workflow_id: updatedWorkflow.n8n_workflow_id,
            created_at: updatedWorkflow.created_at,
            updated_at: updatedWorkflow.updated_at,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      // Pipedream API call failed - keep workflow in database but mark as inactive
      pipedreamError =
        error instanceof PipedreamError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Unknown Pipedream API error";

      console.error("Pipedream API error:", pipedreamError, error);

      // Update workflow to mark it as inactive due to Pipedream error
      const erroredWorkflow = await prisma.workflows.update({
        where: { id: workflow.id },
        data: {
          active: false, // Mark as inactive since Pipedream creation failed
        },
      });

      // Return workflow with error information
      return NextResponse.json(
        {
          ok: false,
          error: "Workflow created in database but failed to create in Pipedream",
          pipedream_error: pipedreamError,
          workflow: {
            id: erroredWorkflow.id,
            name: erroredWorkflow.name,
            description: erroredWorkflow.description,
            intent: erroredWorkflow.intent,
            trigger: erroredWorkflow.trigger,
            actions: erroredWorkflow.actions,
            active: erroredWorkflow.active, // Will be false
            n8n_workflow_id: erroredWorkflow.n8n_workflow_id, // Will be null
            created_at: erroredWorkflow.created_at,
            updated_at: erroredWorkflow.updated_at,
          },
        },
        { status: 207 } // 207 Multi-Status - partial success
      );
    }
  } catch (error: any) {
    console.error("WORKFLOW GENERATE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
