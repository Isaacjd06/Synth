"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
        user_id: SYSTEM_USER_ID, // Security scope
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    // Build update object dynamically
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (intent !== undefined) updateData.intent = intent;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (actions !== undefined) updateData.actions = actions;
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
      const connectionValidation = await validateAppConnections(plan, SYSTEM_USER_ID);
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

    // 3. All validations passed, update workflow
    const workflow = await prisma.workflows.update({
      where: {
        id,
        user_id: SYSTEM_USER_ID, // Security scope
      },
      data: updateData,
    });

    return NextResponse.json(workflow, { status: 200 });

  } catch (error: any) {
    console.error("WORKFLOW UPDATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
