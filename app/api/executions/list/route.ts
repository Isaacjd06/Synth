"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.executions.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("EXECUTION LIST ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
