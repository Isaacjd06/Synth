"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";
import { validateWorkflowPlan } from "@/lib/workflow/validator";

// TEMP system user (until full auth is wired in)
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, description, intent, trigger, actions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required." },
        { status: 400 }
      );
    }

    // Validate workflow structure first
    const rawPlan = {
      name,
      description: description || "",
      intent: intent || "",
      trigger: trigger || {},
      actions: actions || [],
      metadata: {},
    };

    const workflowValidation = validateWorkflowPlan(rawPlan);
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

    // Validate app connections before creating workflow
    const connectionValidation = await validateAppConnections(plan, SYSTEM_USER_ID);
    if (!connectionValidation.ok) {
      return NextResponse.json(
        {
          error: connectionValidation.error,
          missingApps: connectionValidation.missingApps,
        },
        { status: 400 }
      );
    }

    // All validations passed, create workflow
    const workflow = await prisma.workflows.create({
      data: {
        user_id: SYSTEM_USER_ID,
        name,
        description: description || "",
        intent: intent || "",
        trigger: trigger || {},
        actions: actions || [],
        active: false,
      },
    });

    return NextResponse.json(workflow, { status: 201 });

  } catch (error: any) {
    console.error("WORKFLOW CREATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
