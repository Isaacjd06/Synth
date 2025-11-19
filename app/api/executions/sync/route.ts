"use server";

import { NextResponse } from "next/server";

/**
 * MVP placeholder endpoint.
 * Future versions will pull execution history from n8n.
 * For now, Sync simply returns a confirmation response.
 */

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: "Execution sync endpoint is active (MVP placeholder). No sync performed.",
    },
    { status: 200 }
  );
}
