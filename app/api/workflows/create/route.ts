import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { validateAppConnections } from "@/lib/workflow/connectionValidator";
import { validateWorkflowPlan } from "@/lib/workflow/validator";
import { checkWorkflowLimit } from "@/lib/feature-gate";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { learnFromWorkflow } from "@/lib/workflow/workflowLearner";

interface WorkflowCreateRequestBody {
  name: string;
  description?: string;
  intent?: string;
  trigger?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  created_by_ai?: boolean;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json() as WorkflowCreateRequestBody;

    const { name, description, intent, trigger, actions, created_by_ai } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required." },
        { status: 400 },
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
        { status: 400 },
      );
    }

    const plan = workflowValidation.plan;

    // Validate app connections before creating workflow
    const connectionValidation = await validateAppConnections(plan, userId);
    if (!connectionValidation.ok) {
      return NextResponse.json(
        {
          error: connectionValidation.error,
          missingApps: connectionValidation.missingApps,
        },
        { status: 400 },
      );
    }

    // Check workflow limit based on subscription plan
    const workflowLimitCheck = await checkWorkflowLimit(userId);
    if (!workflowLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Workflow limit reached. You have ${workflowLimitCheck.currentCount} workflow(s). Maximum allowed: ${workflowLimitCheck.maxAllowed}. Please upgrade to Pro to create more workflows.`,
        },
        { status: 403 },
      );
    }

    // All validations passed, create workflow
    const workflow = await prisma.workflows.create({
      data: {
        user_id: userId,
        name,
        description: description || "",
        intent: intent || "",
        trigger: (trigger as Prisma.InputJsonValue) || {},
        actions: (actions as Prisma.InputJsonValue) || [],
        active: false,
        created_by_ai: created_by_ai || false,
      },
    });

    // Log audit event
    await logAudit("workflow.create", userId, {
      workflow_id: workflow.id,
      workflow_name: workflow.name,
    });

    // Emit event
    Events.emit("workflow:created", {
      workflow_id: workflow.id,
      user_id: userId,
      workflow_name: workflow.name,
    });

    // Learn from manually created workflows (async, don't wait)
    if (!created_by_ai) {
      learnFromWorkflow(workflow.id, userId, {
        name: workflow.name,
        description: workflow.description,
        intent: workflow.intent,
        trigger: workflow.trigger,
        actions: workflow.actions,
        created_by_ai: false,
      }).catch(error => {
        console.error("Failed to learn from workflow:", error);
      });
    }

    return NextResponse.json(workflow, { status: 201 });
  } catch (error: unknown) {
    console.error("WORKFLOW CREATE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
