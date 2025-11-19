"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      where: { user_id: SYSTEM_USER_ID },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      { ok: true, data: memories },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("MEMORY LIST ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
