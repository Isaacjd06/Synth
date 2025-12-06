"use server";

import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required." },
        { status: 400 }
      );
    }

    // Ensure memory belongs to the current user
    const existing = await prisma.memory.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Memory entry not found." },
        { status: 404 }
      );
    }

    await prisma.memory.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        ok: true,
        deleted_id: id,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("MEMORY DELETE ERROR:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
