import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cleanupExecutions } from "@/lib/cron/cleanup-executions";
import { cleanupUsageLogs } from "@/lib/cron/cleanup-usage";
import { cleanupAuditLogs } from "@/lib/cron/cleanup-audit";

/**
 * POST /api/cron/cleanup
 *
 * Vercel cron endpoint that runs all cleanup tasks.
 * Requires CRON_SECRET environment variable for security.
 */
export async function POST(req: Request) {
  try {
    // 1. Validate CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    // 2. Get authorization header
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Vercel Cron sends secret in Authorization header as "Bearer <secret>"
    // or as a custom header "x-vercel-cron-secret"
    const vercelSecret = headersList.get("x-vercel-cron-secret");
    const bearerToken = authHeader?.replace("Bearer ", "");

    const providedSecret = vercelSecret || bearerToken;

    if (!providedSecret || providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Run all cleanup functions
    const [executionsResult, usageResult, auditResult] = await Promise.all([
      cleanupExecutions(),
      cleanupUsageLogs(),
      cleanupAuditLogs(),
    ]);

    // 4. Return summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        executions: {
          deleted: executionsResult.deleted,
          error: executionsResult.error || null,
        },
        usageLogs: {
          deleted: usageResult.deleted,
          error: usageResult.error || null,
        },
        auditLogs: {
          deleted: auditResult.deleted,
          error: auditResult.error || null,
        },
      },
      totalDeleted:
        executionsResult.deleted + usageResult.deleted + auditResult.deleted,
    };

    // Check if any cleanup had errors
    const hasErrors =
      executionsResult.error || usageResult.error || auditResult.error;

    return NextResponse.json(summary, {
      status: hasErrors ? 207 : 200, // 207 Multi-Status if partial success
    });
  } catch (error: unknown) {
    console.error("CRON CLEANUP ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Also support GET for manual testing (with secret in query param)
export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    // Get secret from query parameter for manual testing
    const { searchParams } = new URL(req.url);
    const providedSecret = searchParams.get("secret");

    if (!providedSecret || providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all cleanup functions
    const [executionsResult, usageResult, auditResult] = await Promise.all([
      cleanupExecutions(),
      cleanupUsageLogs(),
      cleanupAuditLogs(),
    ]);

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        executions: {
          deleted: executionsResult.deleted,
          error: executionsResult.error || null,
        },
        usageLogs: {
          deleted: usageResult.deleted,
          error: usageResult.error || null,
        },
        auditLogs: {
          deleted: auditResult.deleted,
          error: auditResult.error || null,
        },
      },
      totalDeleted:
        executionsResult.deleted + usageResult.deleted + auditResult.deleted,
    };

    const hasErrors =
      executionsResult.error || usageResult.error || auditResult.error;

    return NextResponse.json(summary, {
      status: hasErrors ? 207 : 200,
    });
  } catch (error: unknown) {
    console.error("CRON CLEANUP ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
