"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate, formatStatus, truncate } from "@/lib/utils";
import { EmptyDashboardState } from "@/components/ui/EmptyState";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface Execution {
  id: string;
  workflow_id: string;
  status?: string | null;
  created_at: string;
  workflow?: {
    id: string;
    name: string;
  };
}

interface Update {
  type: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  workflowId?: string;
  workflowName?: string;
}

interface Stats {
  activeWorkflows: number;
  totalExecutions: number;
  executionsLast24h: number;
  successRate: number;
}

export default function SynthUpdatesCard() {
  const [stats, setStats] = useState<Stats>({
    activeWorkflows: 0,
    totalExecutions: 0,
    executionsLast24h: 0,
    successRate: 0,
  });
  const [updates, setUpdates] = useState<Update[]>([]);
  const [recentWorkflows, setRecentWorkflows] = useState<Workflow[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<string>("operational");

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data from consolidated endpoint
        const response = await fetch("/api/dashboard/updates", {
          cache: "no-store",
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response received:", text.substring(0, 200));
          // Set placeholder data instead of throwing error
          setStats({
            activeWorkflows: 0,
            totalExecutions: 0,
            executionsLast24h: 0,
            successRate: 0,
          });
          setUpdates([]);
          setRecentWorkflows([]);
          setRecentExecutions([]);
          return;
        }

        if (!response.ok) {
          // Try to parse JSON error, but handle gracefully
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If we can't parse JSON, use the status text
          }
          // Set placeholder data instead of throwing error
          setStats({
            activeWorkflows: 0,
            totalExecutions: 0,
            executionsLast24h: 0,
            successRate: 0,
          });
          setUpdates([]);
          setRecentWorkflows([]);
          setRecentExecutions([]);
          return;
        }

        const data = await response.json();

        if (data.ok) {
          setStats(data.stats || {
            activeWorkflows: 0,
            totalExecutions: 0,
            executionsLast24h: 0,
            successRate: 0,
          });
          setUpdates(data.updates || []);
          setRecentWorkflows(data.recentWorkflows || []);
          setRecentExecutions(data.recentExecutions || []);
          setSystemStatus(data.systemStatus || "operational");
        } else {
          throw new Error(data.error || "Failed to load dashboard data");
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Error fetching dashboard data:", error);
        // Set placeholder data on any error
        setStats({
          activeWorkflows: 0,
          totalExecutions: 0,
          executionsLast24h: 0,
          successRate: 0,
        });
        setUpdates([]);
        setRecentWorkflows([]);
        setRecentExecutions([]);
        // Don't set error state - just show empty/placeholder data
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchData();

    // Set up polling: refresh every 30 seconds
    intervalId = setInterval(fetchData, 30000);

    // Cleanup on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const getExecutionStatus = (execution: Execution): "success" | "error" => {
    if (execution.status === "failure" || execution.status === "error") {
      return "error";
    }
    if (execution.status === "success") {
      return "success";
    }
    // Fallback: default to success if status is unknown
    return "success";
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Synth Updates</h2>
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  const getPriorityVariant = (
    priority: string
  ): "success" | "active" | "error" => {
    if (priority === "high") return "error";
    if (priority === "medium") return "active";
    return "success";
  };

  // Show empty state for new users with no data
  const hasNoData = !loading && !error && stats.activeWorkflows === 0 && stats.totalExecutions === 0 && recentWorkflows.length === 0 && recentExecutions.length === 0;
  
  if (hasNoData) {
    return <EmptyDashboardState />;
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Synth Updates
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={systemStatus === "operational" ? "success" : systemStatus === "degraded" ? "active" : "error"}>
              {systemStatus === "operational" ? "Operational" : systemStatus === "degraded" ? "Degraded" : "Error"}
            </Badge>
            <span className="text-xs text-gray-400">System Status</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.activeWorkflows}
            </div>
            <div className="text-sm text-gray-400">Active Workflows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.totalExecutions}
            </div>
            <div className="text-sm text-gray-400">Total Executions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.executionsLast24h}
            </div>
            <div className="text-sm text-gray-400">Last 24 Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
        </div>

        {/* Alerts/Updates Section - NEW */}
        {updates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Recent Alerts
            </h3>
            <div className="space-y-2">
              {updates.map((update, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-800 bg-gray-900/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-white">
                      {update.title}
                    </p>
                    <Badge
                      variant={getPriorityVariant(update.priority)}
                      className="flex-shrink-0"
                    >
                      {update.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{update.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Workflows (limit 3) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Recent Workflows
            </h3>
            <Link
              href="/workflows"
              className="text-xs text-[#194c92] hover:text-[#1a5ba8] transition-colors"
            >
              View All
            </Link>
          </div>
          {recentWorkflows.length === 0 ? (
            <p className="text-sm text-gray-400">No workflows yet</p>
          ) : (
            <div className="space-y-2">
              {recentWorkflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/workflows/${workflow.id}`}
                  className="block p-2 rounded hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white break-words">
                        {truncate(workflow.name, 40)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(workflow.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={workflow.active ? "active" : "inactive"}
                      className="ml-2 flex-shrink-0"
                    >
                      {formatStatus(workflow.active ? "active" : "inactive")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Executions (limit 3) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Recent Executions
            </h3>
            <Link
              href="/executions"
              className="text-xs text-[#194c92] hover:text-[#1a5ba8] transition-colors"
            >
              View All
            </Link>
          </div>
          {recentExecutions.length === 0 ? (
            <p className="text-sm text-gray-400">No executions yet</p>
          ) : (
            <div className="space-y-2">
              {recentExecutions.map((execution) => {
                const status = getExecutionStatus(execution);
                return (
                  <Link
                    key={execution.id}
                    href={`/workflows/${execution.workflow_id}`}
                    className="block p-2 rounded hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white break-words">
                          {truncate(
                            execution.workflow?.name ||
                              `Workflow ${execution.workflow_id.substring(0, 8)}...`,
                            40
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(execution.created_at)}
                        </p>
                      </div>
                      <Badge variant={status} className="ml-2 flex-shrink-0">
                        {formatStatus(status)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

