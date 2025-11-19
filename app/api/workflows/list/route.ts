"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function GET() {
  try {
    const workflows = await prisma.workflows.findMany({
      where: { user_id: SYSTEM_USER_ID },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(workflows, { status: 200 });

  } catch (error: any) {
    console.error("WORKFLOW LIST ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
