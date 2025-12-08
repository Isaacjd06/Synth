import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { deleteWorkflow as deletePipedreamWorkflow } from "@/lib/pipedreamClient";
import { logError } from "@/lib/error-logger";

interface WorkflowDeleteRequestBody {
  id: string;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id } = await req.json() as WorkflowDeleteRequestBody;

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 },
      );
    }

    // Verify the workflow exists and belongs to the user
    const existing = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 },
      );
    }

    // Delete from Pipedream if workflow has a Pipedream ID
    if (existing.n8n_workflow_id) {
      try {
        await deletePipedreamWorkflow(existing.n8n_workflow_id);
      } catch (error) {
        // Log error but don't fail the deletion - we still want to delete from database
        logError("app/api/workflows/delete (Pipedream)", error, {
          workflow_id: id,
          pipedream_workflow_id: existing.n8n_workflow_id,
        });
        // Continue with database deletion even if Pipedream deletion fails
      }
    }

    // Hard delete from database
    await prisma.workflows.delete({
      where: { id },
    });

    // Log audit event
    await logAudit("workflow.delete", userId, {
      workflow_id: id,
      workflow_name: existing.name,
      pipedream_workflow_id: existing.n8n_workflow_id || null,
    });

    return NextResponse.json(
      { success: true, deleted_id: id },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("WORKFLOW DELETE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
