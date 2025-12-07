import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";
import { setWorkflowActive } from "@/lib/pipedreamClient";
import { logError } from "@/lib/error-logger";

interface WorkflowUpdateRequestBody {
  id: string;
  name?: string;
  description?: string;
  intent?: string;
  trigger?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  active?: boolean;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json() as WorkflowUpdateRequestBody;

    const { id, name, description, intent, trigger, actions, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 }
      );
    }

    // 1. Fetch existing workflow to merge with update data
    const existingWorkflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    // Build update object dynamically
    const updateData: {
      name?: string;
      description?: string;
      intent?: string;
      trigger?: Prisma.InputJsonValue;
      actions?: Prisma.InputJsonValue;
      active?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (intent !== undefined) updateData.intent = intent;
    if (trigger !== undefined) updateData.trigger = trigger as Prisma.InputJsonValue;
    if (actions !== undefined) updateData.actions = actions as Prisma.InputJsonValue;
    if (active !== undefined) updateData.active = active;

    // 2. If trigger or actions are being updated, validate the merged workflow plan
    const isUpdatingWorkflowStructure = trigger !== undefined || actions !== undefined;

    if (isUpdatingWorkflowStructure) {
      // Merge update data with existing workflow data for validation
      const mergedPlan = {
        name: updateData.name ?? existingWorkflow.name,
        description: updateData.description ?? existingWorkflow.description ?? "",
        intent: updateData.intent ?? existingWorkflow.intent ?? "",
        trigger: updateData.trigger ?? existingWorkflow.trigger ?? {},
        actions: updateData.actions ?? existingWorkflow.actions ?? [],
        metadata: {},
      };

      // Validate workflow structure
      const workflowValidation = validateWorkflowPlan(mergedPlan);
      if (!workflowValidation.ok) {
        return NextResponse.json(
          {
            error: "Workflow validation failed.",
            details: workflowValidation.details || workflowValidation.error,
          },
          { status: 400 }
        );
      }

      const plan = workflowValidation.plan;

      // Validate app connections before updating workflow
      const connectionValidation = await validateAppConnections(plan, userId);
      if (!connectionValidation.ok) {
        return NextResponse.json(
          {
            error: "Cannot update workflow: " + connectionValidation.error,
            missingApps: connectionValidation.missingApps,
          },
          { status: 400 }
        );
      }
    }

    // 3. If active status is being changed and workflow has Pipedream ID, sync with Pipedream
    if (active !== undefined && existingWorkflow.n8n_workflow_id) {
      try {
        await setWorkflowActive(existingWorkflow.n8n_workflow_id, active);
      } catch (error: unknown) {
        // Log error but don't fail the update - we still update our DB
        logError("app/api/workflows/update (Pipedream sync)", error, {
          workflow_id: id,
          pipedream_workflow_id: existingWorkflow.n8n_workflow_id,
          active,
        });
        // Continue with database update even if Pipedream sync fails
      }
    }

    // 4. All validations passed, update workflow in database
    // Note: user_id check was already done in findFirst above
    const workflow = await prisma.workflows.update({
      where: {
        id, // id is the primary key, sufficient for update
      },
      data: updateData,
    });

    return NextResponse.json(workflow, { status: 200 });

  } catch (error: unknown) {
    console.error("WORKFLOW UPDATE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
