import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Type definitions
interface CreateWorkflowBody {
  user_id: string;
  name: string;
  description?: string;
  intent?: string;
  trigger?: any;
  actions?: any;
  active?: boolean;
  n8n_workflow_id?: string;
}

interface UpdateWorkflowBody {
  id: string;
  name?: string;
  description?: string;
  intent?: string;
  trigger?: any;
  actions?: any;
  active?: boolean;
  n8n_workflow_id?: string;
}

// GET - Fetch all workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    // Filter by user_id if provided
    const workflows = await prisma.workflow.findMany({
      where: userId ? { user_id: userId } : undefined,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: workflows });
  } catch (error) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body: CreateWorkflowBody = await request.json();

    // Validate required fields
    if (!body.user_id || !body.name) {
      return NextResponse.json(
        { success: false, error: "user_id and name are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: body.user_id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflow.create({
      data: {
        user_id: body.user_id,
        name: body.name,
        description: body.description,
        intent: body.intent,
        trigger: body.trigger,
        actions: body.actions,
        active: body.active ?? true,
        n8n_workflow_id: body.n8n_workflow_id,
      },
    });

    return NextResponse.json({ success: true, data: workflow }, { status: 201 });
  } catch (error) {
    console.error("POST /api/workflows error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

// PUT - Update a workflow by id
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateWorkflowBody = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Check if workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: body.id },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflow.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        intent: body.intent,
        trigger: body.trigger,
        actions: body.actions,
        active: body.active,
        n8n_workflow_id: body.n8n_workflow_id,
      },
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error("PUT /api/workflows error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a workflow by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Check if workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 }
      );
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/workflows error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
