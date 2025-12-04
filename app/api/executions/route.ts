import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

// Type definitions
interface CreateExecutionBody {
  workflow_id: string;
  input_data?: any;
  output_data?: any;
  finished_at?: string;
}

interface UpdateExecutionBody {
  id: string;
  input_data?: any;
  output_data?: any;
  finished_at?: string;
}

// GET - Fetch all executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflow_id");

    // Filter by workflow_id if provided, always filter by user_id for security
    const executions = await prisma.execution.findMany({
      where: {
        user_id: SYSTEM_USER_ID, // Security scope check
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
    const body: CreateExecutionBody = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return NextResponse.json(
        { error: "workflow_id is required" },
        { status: 400 }
      );
    }

    // Verify workflow exists and belongs to system user
    const workflow = await prisma.workflows.findFirst({
      where: {
        id: body.workflow_id,
        user_id: SYSTEM_USER_ID, // Security scope check
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
        user_id: workflow.user_id,
        input_data: body.input_data,
        output_data: body.output_data,
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
    const body: UpdateExecutionBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Check if execution exists and belongs to system user
    const existingExecution = await prisma.execution.findFirst({
      where: {
        id: body.id,
        user_id: SYSTEM_USER_ID, // Security scope check
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
        input_data: body.input_data,
        output_data: body.output_data,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Check if execution exists and belongs to system user
    const existingExecution = await prisma.execution.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID, // Security scope check
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
