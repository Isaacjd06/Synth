import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { checkWorkflowLimit } from "@/lib/feature-gate";
import { logAudit } from "@/lib/audit";
import { Events } from "@/lib/events";
import { z } from "zod";

/**
 * Schema for creating a draft workflow (minimal info only)
 */
const DraftWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  intent: z.string().optional(),
});

/**
 * POST /api/workflows/draft
 * 
 * Create a draft workflow with just basic information.
 * This is the first step in manual workflow creation - users can start
 * with just a name and add trigger/actions later.
 * 
 * Requirements:
 * - User must be authenticated
 * - User must have valid subscription
 * - User must not have exceeded workflow limit
 */
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json();
    const validationResult = DraftWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, intent } = validationResult.data;

    // Check workflow limit based on subscription plan
    const workflowLimitCheck = await checkWorkflowLimit(userId);
    if (!workflowLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Workflow limit reached. You have ${workflowLimitCheck.currentCount} workflow(s). Maximum allowed: ${workflowLimitCheck.maxAllowed}. Please upgrade to Pro to create more workflows.`,
        },
        { status: 403 }
      );
    }

    // Create draft workflow (trigger and actions are null, indicating it's incomplete)
    const workflow = await prisma.workflows.create({
      data: {
        user_id: userId,
        name,
        description: description || null,
        intent: intent || null,
        trigger: null, // Draft workflows don't have triggers yet
        actions: null, // Draft workflows don't have actions yet
        active: false, // Drafts are never active
        created_by_ai: false, // This is a manual workflow
        updated_at: new Date(),
      },
    });

    // Log audit event
    await logAudit("workflow.draft.create", userId, {
      workflow_id: workflow.id,
      workflow_name: workflow.name,
    });

    // Emit event
    Events.emit("workflow:draft:created", {
      workflow_id: workflow.id,
      user_id: userId,
      workflow_name: workflow.name,
    });

    return NextResponse.json(
      {
        ok: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          intent: workflow.intent,
          trigger: workflow.trigger,
          actions: workflow.actions,
          active: workflow.active,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at,
          isDraft: !workflow.trigger || !workflow.actions, // Helper flag to indicate draft status
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("DRAFT WORKFLOW CREATE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/draft
 * 
 * List all draft workflows for the authenticated user.
 * Draft workflows are those without trigger or actions configured.
 */
export async function GET() {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    // Find workflows that are incomplete (missing trigger or actions)
    const draftWorkflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
        OR: [
          { trigger: null },
          { actions: null },
        ],
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      drafts: draftWorkflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        intent: w.intent,
        trigger: w.trigger,
        actions: w.actions,
        active: w.active,
        created_at: w.created_at,
        updated_at: w.updated_at,
        isDraft: !w.trigger || !w.actions,
      })),
    });
  } catch (error: unknown) {
    console.error("DRAFT WORKFLOW LIST ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

