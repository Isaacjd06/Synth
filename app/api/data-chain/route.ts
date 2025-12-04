import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.user.findMany({
      include: {
        workflows: {
          include: {
            executions: true, // include all executions for each workflow
          },
        },
        connections: true,   // include user's linked services
        memory: true,        // include user memory records
        chatMessages: true, // include all chat messages
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching data chain:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
