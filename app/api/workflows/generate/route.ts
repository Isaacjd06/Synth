"use server";

import { NextResponse } from "next/server";
import { generateWorkflowPlan } from "@/lib/ai/generateWorkflowPlan";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const result = await generateWorkflowPlan(prompt);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, draft: result.draft },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("WORKFLOW GENERATE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

