import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET() {
  try {
    console.log("[TEST] Attempting to initiate Google sign-in...");

    // Try to call signIn programmatically
    const result = await signIn("google", {
      redirect: false,
    });

    console.log("[TEST] signIn result:", result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[TEST] Error during sign-in test:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
