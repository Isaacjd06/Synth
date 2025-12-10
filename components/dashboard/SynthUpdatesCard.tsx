"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, truncate } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

interface Workflow {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error";
  createdAt: string;
}

interface Stats {
  activeWorkflows: number;
  totalExecutions: number;
  executionsLast24h: number;
  successRate: number;
}

interface UpdatesData {
  ok: boolean;
  updates: Alert[];
  stats: Stats;
  recentWorkflows: Workflow[];
  recentExecutions: Execution[];
}

const SynthUpdatesCard = () => {
  const [data, setData] = useState<UpdatesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/updates");
        const result = await response.json();
        if (result.ok) {
          setData(result);
        }
      } catch {
        // Use empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPriorityVariant = (priority: string): "destructive" | "secondary" | "default" => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border/50 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 w-32 bg-muted mb-2" />
              <Skeleton className="h-5 w-40 bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const stats = data?.stats || { activeWorkflows: 0, totalExecutions: 0, executionsLast24h: 0, successRate: 0 };
  const updates = data?.updates || [];
  const workflows = data?.recentWorkflows || [];
  const executions = data?.recentExecutions || [];

  return (
    <Card className="bg-card border-border/50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Synth Updates</h2>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              Operational
            </Badge>
            <span className="text-xs text-muted-foreground">System Status</span>
          </div>
        </div>

        {/* Statistics Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{stats.activeWorkflows}</p>
            <p className="text-sm text-muted-foreground">Active Workflows</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{stats.totalExecutions}</p>
            <p className="text-sm text-muted-foreground">Total Executions</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{stats.executionsLast24h}</p>
            <p className="text-sm text-muted-foreground">Last 24 Hours</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-2xl font-bold text-foreground">{stats.successRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
        </div>

        {/* Recent Alerts */}
        {updates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground/70 mb-3">Recent Alerts</h3>
            <div className="space-y-2">
              {updates.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-muted/10 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm text-foreground">{alert.title}</p>
                    <Badge variant={getPriorityVariant(alert.priority)} className="text-xs capitalize">
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Workflows */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground/70">Recent Workflows</h3>
            <Link 
              to="/app/workflows" 
              className="text-xs text-[#194c92] hover:text-[#1a5ba8] transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {workflows.length > 0 ? (
              workflows.slice(0, 3).map((workflow) => (
                <Link
                  key={workflow.id}
                  to={`/app/workflows/${workflow.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/30 transition-colors block"
                >
                  <div>
                    <p className="text-sm text-foreground">{truncate(workflow.name, 40)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(workflow.createdAt)}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={workflow.status === "active" 
                      ? "bg-green-500/10 text-green-400 border-green-500/30" 
                      : "bg-muted/30 text-muted-foreground border-border/50"
                    }
                  >
                    {workflow.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No workflows yet</p>
            )}
          </div>
        </div>

        {/* Recent Executions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground/70">Recent Executions</h3>
            <Link 
              to="/app/executions" 
              className="text-xs text-[#194c92] hover:text-[#1a5ba8] transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {executions.length > 0 ? (
              executions.slice(0, 3).map((execution) => (
                <Link
                  key={execution.id}
                  to={`/app/workflows/${execution.workflowId}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/30 transition-colors block"
                >
                  <div>
                    <p className="text-sm text-foreground">
                      {truncate(execution.workflowName || `Workflow ${execution.workflowId.slice(0, 8)}...`, 40)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(execution.createdAt)}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={execution.status === "success" 
                      ? "bg-green-500/10 text-green-400 border-green-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                    }
                  >
                    {execution.status === "success" ? "Success" : "Error"}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No executions yet</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SynthUpdatesCard;



