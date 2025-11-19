"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const workflowId = body.workflow_id;
    const inputData = body.input_data ?? body.input ?? {};
    const outputData = body.output_data ?? body.output ?? {};

    if (!workflowId) {
      return NextResponse.json(
        { error: "workflow_id is required" },
        { status: 400 }
      );
    }

    // Save execution log
    const saved = await prisma.executions.create({
      data: {
        workflow_id: workflowId,
        input_data: inputData,
        output_data: outputData,
      },
    });

    return NextResponse.json({ ok: true, saved });

  } catch (error: any) {
    console.error("EXECUTION LOG ERROR:", error);

    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
