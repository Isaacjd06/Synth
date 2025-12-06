"use server";

import { NextResponse } from "next/server";
import { authenticateWithAccessInfo } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await authenticateWithAccessInfo();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId, accessInfo } = authResult;

    // Build where clause based on access level
    let whereClause: any = {
      user_id: userId,
    };

    // If user doesn't have full access, only show executions from trial period
    if (!accessInfo.hasFullAccess && accessInfo.trialEndsAt) {
      whereClause.created_at = {
        lte: accessInfo.trialEndsAt,
      };
    }

    const data = await prisma.execution.findMany({
      where: whereClause,
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
