import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/workflows/list
 * 
 * List all workflows for the authenticated user.
 * Unpaid users can view workflows but not modify them.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }
    const { userId } = authResult;

    const workflows = await prisma.workflows.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    // Return workflows with readOnly flag if user doesn't have full access
    return NextResponse.json(
      workflows.map((w) => ({
        ...w,
        readOnly: !authResult.hasValidSubscription,
      })),
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("WORKFLOW LIST ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
