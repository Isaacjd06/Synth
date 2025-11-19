"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 }
      );
    }

    // Verify the workflow exists and belongs to the system user
    const existing = await prisma.workflows.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found." },
        { status: 404 }
      );
    }

    // Hard delete (simple and clean for MVP)
    await prisma.workflows.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, deleted_id: id },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("WORKFLOW DELETE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
