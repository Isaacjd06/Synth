"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

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
    const saved = await prisma.execution.create({
      data: {
        workflow_id: workflowId,
        user_id: SYSTEM_USER_ID, // Add user_id for schema compliance
        input_data: inputData,
        output_data: outputData,
        status: outputData?.error ? "failure" : "success",
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
