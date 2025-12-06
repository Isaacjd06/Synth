import { NextResponse } from "next/server";
import { authenticateWithAccessInfo } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/dashboard/advisory
 * 
 * Returns Synth Advisory - intelligent business guidance based on workflow executions,
 * knowledge base, and user behavior.
 * For unpaid users, returns empty advisory.
 */
export async function GET() {
  try {
    const authResult = await authenticateWithAccessInfo();
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401
    }

    const { userId, accessInfo } = authResult;

    // If user doesn't have full access, return empty advisory
    if (!accessInfo.hasFullAccess) {
      return NextResponse.json({
        ok: true,
        insights: [],
      });
    }

    // Get existing advisory insights from database
    const storedInsights = await prisma.advisoryInsight.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 10,
    });

    // If we have recent stored insights (less than 1 hour old), return them
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    if (
      storedInsights.length > 0 &&
      new Date(storedInsights[0].created_at) > oneHourAgo
    ) {
      return NextResponse.json({
        ok: true,
        insights: storedInsights.map((insight: Record<string, unknown>) => ({
          id: insight.id,
          sourceType: insight.source_type,
          title: insight.title,
          body: insight.body,
          priority: insight.priority,
          category: insight.category,
          createdAt: insight.created_at,
        })),
      });
    }

    // Generate new insights based on current data
    const insights: Array<Record<string, unknown>> = [];

    // 1. Analyze workflow patterns
    const workflows = await prisma.workflows.findMany({
      where: {
        user_id: userId,
      },
      include: {
        executions: {
          orderBy: {
            created_at: "desc",
          },
          take: 20,
        },
      },
    });

    // Check for abandoned workflows (created but never activated)
    const inactiveWorkflows = workflows.filter((w) => !w.active);
    if (inactiveWorkflows.length > 0) {
      insights.push({
        sourceType: "workflow_pattern",
        title: `You have ${inactiveWorkflows.length} inactive workflow${inactiveWorkflows.length > 1 ? "s" : ""}`,
        body: `Consider reviewing and activating these workflows to maximize your automation. Inactive workflows can be useful templates for future use.`,
        priority: "medium",
        category: "efficiency",
      });
    }

    // Check for workflows with low execution frequency
    const lowFrequencyWorkflows = workflows.filter((w) => {
      if (w.executions.length === 0) return false;
      const lastExecution = w.executions[0];
      const daysSinceLastRun =
        (new Date().getTime() -
          new Date(lastExecution.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysSinceLastRun > 30 && w.active;
    });

    if (lowFrequencyWorkflows.length > 0) {
      insights.push({
        sourceType: "workflow_pattern",
        title: `${lowFrequencyWorkflows.length} workflow${lowFrequencyWorkflows.length > 1 ? "s haven't" : " hasn't"} run in over 30 days`,
        body: `These workflows may need review or optimization. Consider whether they're still relevant or if they need trigger adjustments.`,
        priority: "medium",
        category: "optimization",
      });
    }

    // 2. Analyze execution patterns
    const totalExecutions = await prisma.execution.count({
      where: {
        user_id: userId,
      },
    });

    if (totalExecutions > 10) {
      const successCount = await prisma.execution.count({
        where: {
          user_id: userId,
          status: "success",
        },
      });
      const successRate = (successCount / totalExecutions) * 100;

      if (successRate > 90) {
        insights.push({
          sourceType: "execution_stats",
          title: "Excellent workflow reliability",
          body: `Your workflows have a ${successRate.toFixed(0)}% success rate. Great job maintaining reliable automations!`,
          priority: "low",
          category: "growth",
        });
      } else if (successRate < 70) {
        insights.push({
          sourceType: "execution_stats",
          title: "Workflow reliability needs attention",
          body: `Your workflows have a ${successRate.toFixed(0)}% success rate. Consider reviewing failed executions to identify and fix issues.`,
          priority: "high",
          category: "reliability",
        });
      }
    }

    // 3. Check knowledge base usage
    const knowledgeCount = await prisma.knowledge.count({
      where: {
        user_id: userId,
      },
    });

    if (knowledgeCount === 0) {
      insights.push({
        sourceType: "knowledge",
        title: "Add business knowledge to improve automation",
        body: `Synth can provide better recommendations and build more contextual workflows when it understands your business. Add knowledge about your processes, customers, or goals.`,
        priority: "medium",
        category: "growth",
      });
    }

    // 4. Analyze connection usage
    const connections = await prisma.connection.findMany({
      where: {
        user_id: userId,
        status: "active",
      },
    });

    if (connections.length === 0) {
      insights.push({
        sourceType: "behavior",
        title: "Connect your apps to unlock automation",
        body: `Connect apps like Gmail, Slack, or CRM systems to enable powerful workflow automation across your tools.`,
        priority: "medium",
        category: "growth",
      });
    }

    // Store insights in database
    if (insights.length > 0) {
      await prisma.advisoryInsight.createMany({
        data: insights.map((insight) => ({
          user_id: userId,
          source_type: insight.sourceType,
          title: insight.title,
          body: insight.body,
          priority: insight.priority || "medium",
          category: insight.category,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      insights: insights.map((insight, index) => ({
        id: `generated-${Date.now()}-${index}`,
        ...insight,
        createdAt: new Date(),
      })),
    });
  } catch (error: unknown) {
    logError("app/api/dashboard/advisory", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

