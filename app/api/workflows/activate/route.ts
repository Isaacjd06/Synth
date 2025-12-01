"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { buildN8nWorkflowFromPlan } from "@/lib/workflow/builder";
import { deployWorkflow } from "@/lib/n8n/deployWorkflow";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 }
      );
    }

    // 1. Fetch workflow
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    // Ensure these fields exist for validation/building
    if (!workflow.trigger || !workflow.actions) {
      return NextResponse.json(
        {
          error:
            "This workflow does not have trigger/actions defined yet and cannot be activated.",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const plan = validation.plan;

    // 3. Build n8n workflow JSON
    const n8nWorkflow = buildN8nWorkflowFromPlan(plan);

    // 4. Deploy to n8n
    const deploy = await deployWorkflow(n8nWorkflow);

    if (!deploy.ok) {
      return NextResponse.json(
        {
          error: "Failed to deploy workflow to n8n.",
          details: deploy.details || deploy.error,
        },
        { status: 500 }
      );
    }

    const n8nId = deploy.workflowId;

    // 5. Save n8n workflow ID in Neon
    await prisma.workflows.update({
      where: { id },
      data: {
        n8n_workflow_id: n8nId.toString(),
        active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workflow activated successfully.",
        n8n_workflow_id: n8nId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("WORKFLOW ACTIVATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
