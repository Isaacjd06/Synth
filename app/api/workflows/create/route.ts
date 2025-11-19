"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // ✅ Corrected import path

// TEMP system user (until full auth is wired in)
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, description, intent, trigger, actions } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required." },
        { status: 400 }
      );
    }

    const workflow = await prisma.workflows.create({
      data: {
        user_id: SYSTEM_USER_ID,
        name,
        description: description || "",
        intent: intent || "",
        trigger: trigger || {},
        actions: actions || [],
        active: false,
      },
    });

    return NextResponse.json(workflow, { status: 201 });

  } catch (error: any) {
    console.error("WORKFLOW CREATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
