/**
 * POST /api/activate-workflow
 * 
 * LEGACY ROUTE: This route is deprecated. Use /api/workflows/activate instead.
 * This route redirects to the new activation endpoint for backward compatibility.
 * 
 * MVP: Synth uses Pipedream only. This route has been converted from n8n to Pipedream.
 */
import { NextRequest, NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";
import { deployWorkflow } from "@/lib/pipedream/deployWorkflow";

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body as JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { workflow_id } = body;

    if (!workflow_id || typeof workflow_id !== "string") {
      return NextResponse.json(
        { error: "workflow_id is required and must be a string" },
        { status: 400 }
      );
    }

    // Fetch workflow from Neon (Prisma)
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: workflow_id,
        user_id: userId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Check if workflow is already active
    if (workflow.active && workflow.n8n_workflow_id) {
      return NextResponse.json(
        {
          message: "Workflow is already active"
        },
        { status: 200 }
      );
    }

    // Ensure these fields exist for validation/building
    if (!workflow.trigger || !workflow.actions) {
      return NextResponse.json(
        {
          error: "This workflow does not have trigger/actions defined yet and cannot be activated.",
        },
        { status: 400 }
      );
    }

    // Validate stored workflow plan
    const rawPlan = {
      name: workflow.name,
      description: workflow.description || "",
      intent: workflow.intent || "",
      trigger: workflow.trigger,
      actions: workflow.actions,
      metadata: {},
    };

    const validation = validateWorkflowPlan(rawPlan);

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "Workflow validation failed.",
          details: validation.details || validation.error,
        },
        { status: 400 }
      );
    }

    const plan = validation.plan;

    // Validate app connections before activating workflow
    const connectionValidation = await validateAppConnections(plan, userId);
    if (!connectionValidation.ok) {
      return NextResponse.json(
        {
          error: "Cannot activate workflow: " + connectionValidation.error,
          missingApps: connectionValidation.missingApps,
        },
        { status: 400 }
      );
    }

    // Deploy workflow
    const deploy = await deployWorkflow(plan);

    if (!deploy.ok) {
      return NextResponse.json(
        {
          error: "Failed to deploy workflow.",
          details: deploy.details || deploy.error,
        },
        { status: 500 }
      );
    }

    const pipedreamWorkflowId = deploy.workflowId;

    // Update workflow in Neon (Prisma)
    // NOTE: Using n8n_workflow_id field temporarily for MVP to store Pipedream ID
    try {
      await prisma.workflows.update({
        where: { id: workflow_id },
        data: {
          n8n_workflow_id: pipedreamWorkflowId, // TEMPORARY: Stores Pipedream ID
          active: true,
        },
      });
    } catch (updateError: unknown) {
      console.error("Failed to update workflow:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update database after workflow activation",
          details: updateError instanceof Error ? updateError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Workflow activated successfully"
    });
  } catch (error) {
    console.error("Activate workflow error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}


