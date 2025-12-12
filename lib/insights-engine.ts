/**
 * Insights Engine
 * 
 * Analyzes workflows and executions to generate meaningful insights
 * and recommendations for users.
 */

import { prisma } from "@/lib/prisma";
import type { InsightsResult } from "@/types/api";

/**
 * Insights Engine
 * 
 * Analyzes workflows and executions to generate meaningful insights
 * and recommendations for users.
 */

/**
 * Generate insights for a user
 * 
 * Analyzes workflows and executions to identify:
 * - Workflows with high failure rates
 * - Workflows that haven't run recently
 * - Workflows with very high execution counts
 * - Common error patterns
 * - Optimization opportunities
 * 
 * @param userId - User ID
 * @returns Insights result with recommendations
 */
export async function generateInsightsForUser(
  userId: string
): Promise<InsightsResult> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all workflows for the user
  const workflows = await prisma.workflows.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      name: true,
      active: true,
      created_at: true,
    },
  });

  const automationsToOptimize: InsightsResult["automationsToOptimize"] = [];
  const performanceWarnings: InsightsResult["performanceWarnings"] = [];
  const suggestedSkills: InsightsResult["suggestedSkills"] = [];

  // Analyze each workflow
  for (const workflow of workflows) {
    // Get executions for this workflow
    const allExecutions = await prisma.executions.findMany({
      where: { workflow_id: workflow.id },
      select: {
        id: true,
        status: true,
        created_at: true,
        error_message: true,
        execution_time_ms: true,
      },
      orderBy: { created_at: "desc" },
    });

    const executions24h = allExecutions.filter(
      (e) => e.created_at >= last24h
    );
    const executions7days = allExecutions.filter(
      (e) => e.created_at >= last7days
    );
    const executions30days = allExecutions.filter(
      (e) => e.created_at >= last30days
    );

    // Check for high failure rate
    if (executions24h.length >= 3) {
      const failures = executions24h.filter(
        (e) => e.status === "error" || e.status === "failure"
      ).length;
      const failureRate = (failures / executions24h.length) * 100;

      if (failureRate > 30) {
        // High failure rate
        const severity = failureRate > 60 ? "error" : failureRate > 40 ? "warning" : "info";
        
        automationsToOptimize.push({
          id: `opt-${workflow.id}`,
          title: `${workflow.name} has a ${failureRate.toFixed(0)}% failure rate`,
          description: `${workflow.name} has failed ${failures} out of ${executions24h.length} times in the last 24 hours. Consider reviewing the workflow configuration or checking for integration issues.`,
          severity,
          workflowId: workflow.id,
        });
      }
    }

    // Check for workflows that haven't run in a long time
    if (workflow.active && allExecutions.length > 0) {
      const lastExecution = allExecutions[0];
      const daysSinceLastRun = Math.floor(
        (now.getTime() - lastExecution.created_at.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSinceLastRun > 7) {
        performanceWarnings.push({
          id: `warn-${workflow.id}-inactive`,
          title: `${workflow.name} hasn't run in ${daysSinceLastRun} days`,
          description: `This workflow is active but hasn't executed in ${daysSinceLastRun} days. It may not be triggering correctly, or the trigger conditions may not be met.`,
          severity: "warning",
          workflowId: workflow.id,
        });
      }
    }

    // Check for very high execution counts (potential performance issue)
    if (executions24h.length > 100) {
      performanceWarnings.push({
        id: `warn-${workflow.id}-high-volume`,
        title: `${workflow.name} has very high execution volume`,
        description: `This workflow has executed ${executions24h.length} times in the last 24 hours. Consider optimizing the workflow or reviewing if this volume is expected.`,
        severity: "info",
        workflowId: workflow.id,
      });
    }

    // Check for common error patterns
    if (executions24h.length > 0) {
      const errorExecutions = executions24h.filter(
        (e) => e.status === "error" || e.status === "failure"
      );

      if (errorExecutions.length >= 3) {
        // Group errors by error message
        const errorGroups = new Map<string, number>();
        errorExecutions.forEach((exec) => {
          const errorMsg = exec.error_message || "Unknown error";
          errorGroups.set(errorMsg, (errorGroups.get(errorMsg) || 0) + 1);
        });

        // Find most common error
        let mostCommonError = "";
        let maxCount = 0;
        errorGroups.forEach((count, errorMsg) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonError = errorMsg;
          }
        });

        if (maxCount >= 3) {
          automationsToOptimize.push({
            id: `opt-${workflow.id}-error`,
            title: `${workflow.name} frequently fails with the same error`,
            description: `This workflow has failed ${maxCount} times with the error: "${mostCommonError.substring(0, 100)}". This suggests a recurring issue that should be addressed.`,
            severity: "error",
            workflowId: workflow.id,
          });
        }
      }
    }

    // Check for slow executions
    if (executions24h.length > 0) {
      const slowExecutions = executions24h.filter(
        (e) => e.execution_time_ms && e.execution_time_ms > 10000 // > 10 seconds
      );

      if (slowExecutions.length > executions24h.length * 0.2) {
        // More than 20% are slow
        const avgTime = slowExecutions.reduce(
          (sum, e) => sum + (e.execution_time_ms || 0),
          0
        ) / slowExecutions.length;

        performanceWarnings.push({
          id: `warn-${workflow.id}-slow`,
          title: `${workflow.name} has slow execution times`,
          description: `${slowExecutions.length} executions took longer than 10 seconds, with an average of ${(avgTime / 1000).toFixed(1)}s. Consider optimizing the workflow steps or checking for bottlenecks.`,
          severity: "warning",
          workflowId: workflow.id,
        });
      }
    }
  }

  // Suggest skills based on user's workflow patterns
  // If user has no active workflows, suggest getting started
  const activeWorkflows = workflows.filter((w) => w.active);
  if (activeWorkflows.length === 0) {
    suggestedSkills.push({
      id: "skill-get-started",
      title: "Get started with prebuilt skills",
      description: "You don't have any active workflows yet. Check out our prebuilt skills to quickly automate common business tasks.",
    });
  }

  // If user has many manual-looking workflows, suggest automation skills
  if (workflows.length > 0 && activeWorkflows.length < workflows.length * 0.5) {
    suggestedSkills.push({
      id: "skill-activate-workflows",
      title: "Activate your workflows",
      description: `You have ${workflows.length - activeWorkflows.length} inactive workflows. Activate them to start automating your business processes.`,
    });
  }

  // If user has high error rates, suggest error handling skills
  const totalExecutions = await prisma.executions.count({
    where: {
      user_id: userId,
      created_at: { gte: last7days },
    },
  });

  const totalErrors = await prisma.executions.count({
    where: {
      user_id: userId,
      status: { in: ["error", "failure"] },
      created_at: { gte: last7days },
    },
  });

  if (totalExecutions > 10 && totalErrors / totalExecutions > 0.2) {
    suggestedSkills.push({
      id: "skill-error-handling",
      title: "Improve error handling",
      description: `Your workflows have a ${((totalErrors / totalExecutions) * 100).toFixed(0)}% error rate. Consider adding error handling and retry logic to improve reliability.`,
    });
  }

  return {
    automationsToOptimize,
    suggestedSkills,
    performanceWarnings,
  };
}

