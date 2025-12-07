import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";
import { deployWorkflow } from "@/lib/pipedream/deployWorkflow";
import { logAudit } from "@/lib/audit";

interface WorkflowActivateRequestBody {
  id: string;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id } = await req.json() as WorkflowActivateRequestBody;

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 },
      );
    }

    // 1. Fetch workflow
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 },
      );
    }

    // Ensure these fields exist for validation/building
    if (!workflow.trigger || !workflow.actions) {
      return NextResponse.json(
        {
          error:
            "This workflow does not have trigger/actions defined yet and cannot be activated.",
        },
        { status: 400 },
      );
    }

    // 2. Validate stored workflow_plan
    const rawPlan = {
      name: workflow.name,
      description: workflow.description || "",
      intent: workflow.intent || "",
      trigger: workflow.trigger, // JSONB field
      actions: workflow.actions, // JSONB array
      metadata: {},
    };

    const validation = validateWorkflowPlan(rawPlan);

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "Workflow validation failed.",
          details: validation.details || validation.error,
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // 3. Deploy workflow (using WorkflowPlan directly, no n8n conversion)
    const deploy = await deployWorkflow(plan);

    if (!deploy.ok) {
      return NextResponse.json(
        {
          error: "Failed to deploy workflow.",
          details: deploy.details || deploy.error,
        },
        { status: 500 },
      );
    }

    const pipedreamWorkflowId = deploy.workflowId;

    // 4. Save Pipedream workflow ID in Neon
    // NOTE: We're using n8n_workflow_id field temporarily for MVP
    // This field will be renamed in a future migration to a generic "executor_workflow_id"
    await prisma.workflows.update({
      where: { id },
      data: {
        n8n_workflow_id: pipedreamWorkflowId, // TEMPORARY: Using this field for MVP
        active: true,
      },
    });

    // Log audit event
    await logAudit("workflow.activate", userId, {
      workflow_id: id,
      workflow_name: workflow.name,
      pipedream_workflow_id: pipedreamWorkflowId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workflow activated successfully.",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("WORKFLOW ACTIVATE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
