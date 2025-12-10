import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/workflows/[id]
 * 
 * Fetches a single workflow by ID for the authenticated user.
 * Returns workflow details including name, description, trigger, actions, and metadata.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const { id: workflowId } = await params;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Fetch workflow by ID and verify ownership
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: workflowId,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        intent: true,
        trigger: true,
        actions: true,
        active: true,
        created_at: true,
        updated_at: true,
        n8n_workflow_id: true,
        pipedream_deployment_state: true,
        created_by_ai: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Return workflow with readOnly flag if user doesn't have full access
    return NextResponse.json(
      {
        ...workflow,
        readOnly: !authResult.hasValidSubscription,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    logError("app/api/workflows/[id] (GET)", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

