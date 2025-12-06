"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatDate, formatStatus, truncate } from "@/lib/utils";

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

export default function SynthUpdatesCard() {
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [recentWorkflows, setRecentWorkflows] = useState<Workflow[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const systemStatus = "Operational"; // Hardcoded as required

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch workflows and executions in parallel from existing API routes
        const [workflowsRes, executionsRes] = await Promise.all([
          fetch("/api/workflows/list", { cache: "no-store" }),
          fetch("/api/executions", { cache: "no-store" }),
        ]);

        if (!workflowsRes.ok) {
          const errorData = await workflowsRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch workflows");
        }

        if (!executionsRes.ok) {
          const errorData = await executionsRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch executions");
        }

        const workflowsData = await workflowsRes.json();
        const executionsData = await executionsRes.json();

        // Parse workflows - API returns array directly
        const allWorkflows: Workflow[] = Array.isArray(workflowsData) ? workflowsData : [];
        
        // Parse executions - API returns { success: true, data: [...] }
        const allExecutions: Execution[] = 
          executionsData.success && Array.isArray(executionsData.data)
            ? executionsData.data
            : [];

        // Set totals
        setTotalWorkflows(allWorkflows.length);
        setTotalExecutions(allExecutions.length);

        // Set recent items (already ordered by created_at desc from API)
        // Limit to 3 as required
        setRecentWorkflows(allWorkflows.slice(0, 3));
        setRecentExecutions(allExecutions.slice(0, 3));
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage = err.message || "Failed to load dashboard data";
        setError(errorMessage);
        toast.error("Failed to Load Dashboard", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  if (error) {
    return (
      <Card className="border-red-800 bg-red-900/10">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Synth Updates</h2>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[#194c92] hover:text-[#1a5ba8] transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
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
            <Badge variant="success">{systemStatus}</Badge>
            <span className="text-xs text-gray-400">System Status</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">
              {totalWorkflows}
            </div>
            <div className="text-sm text-gray-400">Total Workflows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {totalExecutions}
            </div>
            <div className="text-sm text-gray-400">Total Executions</div>
          </div>
        </div>

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

