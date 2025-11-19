"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id, name, description, intent, trigger, actions, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required." },
        { status: 400 }
      );
    }

    // Build update object dynamically
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (intent !== undefined) updateData.intent = intent;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (actions !== undefined) updateData.actions = actions;
    if (active !== undefined) updateData.active = active;

    const workflow = await prisma.workflows.update({
      where: {
        id,
        user_id: SYSTEM_USER_ID, // Security scope
      },
      data: updateData,
    });

    return NextResponse.json(workflow, { status: 200 });

  } catch (error: any) {
    console.error("WORKFLOW UPDATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
