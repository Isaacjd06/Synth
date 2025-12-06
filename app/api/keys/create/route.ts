import { NextResponse } from "next/server";
import { authenticateAndCheckSubscription } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/api-keys";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user and check subscription
    const authResult = await authenticateAndCheckSubscription();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 or 403
    }
    const { userId } = authResult;

    // 2. Parse request body for optional name
    const body = await req.json().catch(() => ({}));
    const { name } = body;

    // Validate name if provided
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid name parameter" },
        { status: 400 }
      );
    }

    if (name && (name.length < 1 || name.length > 100)) {
      return NextResponse.json(
        { error: "Name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    // 3. Generate new API key
    const apiKey = await generateApiKey(userId, name);

    // 4. Return the raw API key (only shown once)
    return NextResponse.json(
      {
        apiKey,
        message:
          "API key created successfully. Store this key securely - it will not be shown again.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("API KEY CREATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
