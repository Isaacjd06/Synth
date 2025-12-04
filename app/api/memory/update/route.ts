"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, context_type, content, relevance_score, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 }
      );
    }

    // Confirm memory entry exists and belongs to the user
    const existing = await prisma.memory.findFirst({
      where: {
        id,
        user_id: SYSTEM_USER_ID,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Memory entry not found." },
        { status: 404 }
      );
    }

    // Build update object dynamically
    const updateData: any = {};
    if (context_type !== undefined) updateData.context_type = context_type;
    if (content !== undefined) updateData.content = content;
    if (relevance_score !== undefined) updateData.relevance_score = relevance_score;
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.last_accessed = new Date(); // Always update last_accessed

    const updated = await prisma.memory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        ok: true,
        memory: updated,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("MEMORY UPDATE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
