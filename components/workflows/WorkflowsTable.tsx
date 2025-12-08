"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Loader2, Play, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { EmptyWorkflowsState } from "@/components/ui/EmptyState";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  active: boolean;
  n8n_workflow_id: string | null;
}

interface WorkflowsTableProps {
  workflows: Workflow[];
  error: string | null;
}

export default function WorkflowsTable({ workflows: initialWorkflows, error }: WorkflowsTableProps) {
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [syncing, setSyncing] = useState(false);

  // Sync workflow status from Pipedream
  const syncWorkflowStatus = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/workflows/sync-status", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.ok) {
        // Reload page to get updated workflow status
        window.location.reload();
      } else {
        toast.error("Failed to sync workflow status", {
          description: data.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error syncing workflow status:", error);
      toast.error("Failed to sync workflow status");
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync on mount and every 30 seconds
  useEffect(() => {
    syncWorkflowStatus();
    const interval = setInterval(syncWorkflowStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunWorkflow = async (workflowId: string) => {
    if (runningWorkflowId) {
      return; // Prevent multiple simultaneous runs
    }

    setRunningWorkflowId(workflowId);

    try {
      const response = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        toast.success("Workflow executed successfully", {
          description: `Execution ID: ${data.execution?.id || "N/A"}`,
        });
      } else {
        toast.error("Failed to run workflow", {
          description: data.error || "Unknown error occurred",
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error running workflow:", err);
      toast.error("Failed to run workflow", {
        description: err.message || "Network error occurred",
      });
    } finally {
      setRunningWorkflowId(null);
    }
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <p className="text-red-400">Error loading workflows: {error}</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
        <EmptyWorkflowsState />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Your Workflows</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={syncWorkflowStatus}
          disabled={syncing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Status"}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Name</TableHead>
            <TableHead className="text-white">Description</TableHead>
            <TableHead className="text-white">Created</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.map((workflow) => (
            <TableRow key={workflow.id}>
              <TableCell className="font-medium text-white">
                {workflow.name}
              </TableCell>
              <TableCell className="text-gray-400">
                {workflow.description || (
                  <span className="italic text-gray-500">No description</span>
                )}
              </TableCell>
              <TableCell className="text-gray-400">
                <div className="flex flex-col">
                  <span>{formatDate(workflow.created_at)}</span>
                  {workflow.updated_at && workflow.updated_at.getTime() !== workflow.created_at.getTime() && (
                    <span className="text-xs text-gray-500">
                      Updated {formatDate(workflow.updated_at)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {workflow.active ? (
                  <Badge className="bg-green-900/30 text-green-300 border-green-700/50">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-800 text-gray-400 border-gray-700">
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/workflows/${workflow.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </Button>
                  </Link>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleRunWorkflow(workflow.id)}
                    disabled={runningWorkflowId === workflow.id || !workflow.n8n_workflow_id}
                    className="gap-1"
                  >
                    {runningWorkflowId === workflow.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

