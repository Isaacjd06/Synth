"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { context_type, content, relevance_score, metadata } = body;

    if (!context_type || content === undefined) {
      return NextResponse.json(
        { error: "Both 'context_type' and 'content' are required." },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        user_id: SYSTEM_USER_ID,
        context_type,
        content,
        relevance_score: relevance_score || null,
        metadata: metadata || null,
        last_accessed: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        memory,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("MEMORY CREATE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
