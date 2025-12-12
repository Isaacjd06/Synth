import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { success, error } from "@/lib/api-response";
import type { ExecutionListItem } from "@/types/api";

// Type definitions
interface CreateExecutionBody {
  workflow_id: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  status?: string;
  pipedream_execution_id?: string;
  finished_at?: string;
}

interface UpdateExecutionBody {
  id: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  status?: string;
  pipedream_execution_id?: string;
  finished_at?: string;
}

// GET - Fetch all executions
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId, hasValidSubscription } = authResult;

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflow_id");
    const limitParam = searchParams.get("limit");
    
    // FREE plan: limit to 5 executions max
    // Others: unlimited (or use limit param)
    let limit: number | undefined;
    if (!hasValidSubscription) {
      limit = 5;
    } else if (limitParam) {
      limit = parseInt(limitParam, 10);
    }

    // Filter by workflow_id if provided, always filter by user_id for security
    const executions = await prisma.executions.findMany({
      where: {
        user_id: userId,
        ...(workflowId ? { workflow_id: workflowId } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        workflows: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match expected format
    const executionList = executions.map(exec => ({
      id: exec.id,
      workflowId: exec.workflow_id,
      workflowName: exec.workflows?.name || "Unknown Workflow",
      status: exec.status,
      createdAt: exec.created_at.toISOString(),
      durationMs: exec.execution_time_ms || 
        (exec.started_at && exec.finished_at
          ? new Date(exec.finished_at).getTime() - new Date(exec.started_at).getTime()
          : null),
      errorMessage: exec.error_message,
    }));

    // Return array directly to match UI expectations (similar to workflows list)
    return NextResponse.json(executionList, { status: 200 });
  } catch (err) {
    console.error("GET /api/executions error:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

// POST - Create a new execution
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body: CreateExecutionBody = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return error("workflow_id is required", { status: 400 });
    }

    // Verify workflow exists and belongs to user
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: body.workflow_id,
        user_id: userId,
      },
    });

    if (!workflow) {
      return error("Workflow not found", { status: 404 });
    }

    const execution = await prisma.executions.create({
      data: {
        workflow_id: body.workflow_id,
        user_id: userId,
        input_data: body.input_data as Prisma.InputJsonValue | undefined,
        output_data: body.output_data as Prisma.InputJsonValue | undefined,
        status: body.status || "unknown",
        pipedream_execution_id: body.pipedream_execution_id || null,
        finished_at: body.finished_at ? new Date(body.finished_at) : null,
      },
    });

    return success(execution);
  } catch (err) {
    console.error("POST /api/executions error:", err);
    return error(
      err instanceof Error ? err.message : "Failed to create execution",
      { status: 500 }
    );
  }
}

// PUT - Update an execution by id
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body: UpdateExecutionBody = await request.json();

    if (!body.id) {
      return error("Execution ID is required", { status: 400 });
    }

    // Check if execution exists and belongs to user
    const existingExecution = await prisma.executions.findFirst({
      where: {
        id: body.id,
        user_id: userId,
      },
    });

    if (!existingExecution) {
      return error("Execution not found", { status: 404 });
    }

    const execution = await prisma.executions.update({
      where: { id: body.id },
      data: {
        input_data: body.input_data as Prisma.InputJsonValue | undefined,
        output_data: body.output_data as Prisma.InputJsonValue | undefined,
        status: body.status,
        pipedream_execution_id: body.pipedream_execution_id,
        finished_at: body.finished_at ? new Date(body.finished_at) : undefined,
      },
    });

    return success(execution);
  } catch (err) {
    console.error("PUT /api/executions error:", err);
    return error(
      err instanceof Error ? err.message : "Failed to update execution",
      { status: 500 }
    );
  }
}

// DELETE - Delete an execution by id
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return error("Execution ID is required", { status: 400 });
    }

    // Check if execution exists and belongs to user
    const existingExecution = await prisma.executions.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingExecution) {
      return error("Execution not found", { status: 404 });
    }

    await prisma.executions.delete({
      where: { id },
    });

    return success({ id });
  } catch (err) {
    console.error("DELETE /api/executions error:", err);
    return error(
      err instanceof Error ? err.message : "Failed to delete execution",
      { status: 500 }
    );
  }
}
