import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ExecutionLogRequestBody {
  workflow_id: string;
  input_data?: Record<string, unknown>;
  input?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const body = await req.json() as ExecutionLogRequestBody;

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
        user_id: userId,
        input_data: inputData as Prisma.InputJsonValue,
        output_data: outputData as Prisma.InputJsonValue,
        status: outputData?.error ? "failure" : "success",
      },
    });

    return NextResponse.json({ ok: true, saved });

  } catch (error: unknown) {
    console.error("EXECUTION LOG ERROR:", error);

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
