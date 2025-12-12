import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import type { DashboardSummaryResponse } from "@/types/api";

/**
 * GET /api/dashboard/summary
 * 
 * Returns dashboard summary statistics for the authenticated user.
 * Uses efficient Prisma aggregation queries to avoid N+1.
 */
export async function GET() {
  try {
    const authResult = await authenticateUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userId } = authResult;

    // Use aggregation queries for efficiency
    const [
      activeWorkflows,
      totalExecutions,
      executions24h,
      successfulExecutions,
    ] = await Promise.all([
      // Count active workflows
      prisma.workflows.count({
        where: {
          user_id: userId,
          active: true,
        },
      }),
      // Count total executions
      prisma.executions.count({
        where: {
          user_id: userId,
        },
      }),
      // Count executions in last 24 hours
      prisma.executions.count({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Count successful executions
      prisma.executions.count({
        where: {
          user_id: userId,
          status: "success",
        },
      }),
    ]);

    // Calculate success rate
    const successRate = totalExecutions > 0 
      ? (successfulExecutions / totalExecutions) * 100 
      : 0;

    const summary: DashboardSummaryResponse = {
      activeWorkflows,
      totalExecutions,
      executionsLast24h: executions24h,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
    };

    // Return with stats at top level to match UI expectations
    return success({ stats: summary });
  } catch (err) {
    console.error("DASHBOARD SUMMARY ERROR:", err);
    return error(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 }
    );
  }
}

