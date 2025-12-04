import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeWorkflow } from "@/lib/pipedreamClient";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    // 1. Fetch workflow from Neon with user_id security scope
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID, // Security scope check
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { ok: false, error: "Workflow not found" },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 2. Get Pipedream workflow ID (stored in n8n_workflow_id field temporarily)
    const pipedreamWorkflowId = workflow.n8n_workflow_id;

    if (!pipedreamWorkflowId) {
      return NextResponse.json(
        { ok: false, error: "Workflow is not activated. Please activate it first." },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 3. Execute workflow in Pipedream
    const execution = await executeWorkflow(pipedreamWorkflowId, {});

    // 4. Log execution to Neon database
    await prisma.execution.create({
      data: {
        workflow_id: id,
        user_id: workflow.user_id,
        input_data: {},
        output_data: execution.data?.output || null,
        finished_at: execution.finished_at ? new Date(execution.finished_at) : null,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Workflow executed", execution },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err: any) {
    console.error("Workflow execution error:", err.message);

    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
