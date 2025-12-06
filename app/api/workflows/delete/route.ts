"use server";

import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id } = await req.json();

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

    // Hard delete (simple and clean for MVP)
    await prisma.workflows.delete({
      where: { id },
    });

    // Log audit event
    await logAudit("workflow.delete", userId, {
      workflow_id: id,
      workflow_name: existing.name,
    });

    return NextResponse.json(
      { success: true, deleted_id: id },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("WORKFLOW DELETE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
