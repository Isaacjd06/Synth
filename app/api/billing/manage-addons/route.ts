import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

/**
 * ⚠️ DEPRECATED ENDPOINT
 *
 * This endpoint is no longer supported. Add-ons are ONE-TIME purchases only
 * and cannot be managed as part of subscriptions.
 *
 * Use /api/billing/purchase-addon instead to purchase add-ons.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return error explaining add-ons are one-time purchases
    return NextResponse.json(
      {
        error: "This endpoint is deprecated. Add-ons are one-time purchases only and cannot be managed as part of subscriptions. Use /api/billing/purchase-addon to purchase add-ons.",
        code: "ENDPOINT_DEPRECATED",
      },
      { status: 410 }, // 410 Gone - indicates the resource is no longer available
    );
  } catch (error: unknown) {
    logError("app/api/billing/manage-addons", error, {
      userId: (await auth())?.user?.id,
    });
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
