import { NextRequest, NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflow_id");

    // Filter by workflow_id if provided, always filter by user_id for security
    const executions = await prisma.execution.findMany({
      where: {
        user_id: userId,
        ...(workflowId ? { workflow_id: workflowId } : {}),
      },
      orderBy: { created_at: "desc" },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            user_id: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: executions });
  } catch (error) {
    console.error("GET /api/executions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
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
      return NextResponse.json(
        { error: "workflow_id is required" },
        { status: 400 }
      );
    }

    // Verify workflow exists and belongs to user
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: body.workflow_id,
        user_id: userId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const execution = await prisma.execution.create({
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

    return NextResponse.json({ success: true, data: execution }, { status: 201 });
  } catch (error) {
    console.error("POST /api/executions error:", error);
    return NextResponse.json(
      { error: "Failed to create execution" },
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
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Check if execution exists and belongs to user
    const existingExecution = await prisma.execution.findFirst({
      where: {
        id: body.id,
        user_id: userId,
      },
    });

    if (!existingExecution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    const execution = await prisma.execution.update({
      where: { id: body.id },
      data: {
        input_data: body.input_data as Prisma.InputJsonValue | undefined,
        output_data: body.output_data as Prisma.InputJsonValue | undefined,
        status: body.status,
        pipedream_execution_id: body.pipedream_execution_id,
        finished_at: body.finished_at ? new Date(body.finished_at) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: execution });
  } catch (error) {
    console.error("PUT /api/executions error:", error);
    return NextResponse.json(
      { error: "Failed to update execution" },
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
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Check if execution exists and belongs to user
    const existingExecution = await prisma.execution.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingExecution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    await prisma.execution.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/executions error:", error);
    return NextResponse.json(
      { error: "Failed to delete execution" },
      { status: 500 }
    );
  }
}
