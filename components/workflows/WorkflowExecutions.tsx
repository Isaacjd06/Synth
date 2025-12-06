"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface Execution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error?: string;
}

interface WorkflowExecutionsProps {
  workflowId: string;
}

export default function WorkflowExecutions({ workflowId }: WorkflowExecutionsProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch executions on mount and when workflow is executed
  useEffect(() => {
    fetchExecutions();

    // Listen for workflow execution events
    const handleWorkflowExecuted = () => {
      fetchExecutions();
    };

    window.addEventListener("workflow-executed", handleWorkflowExecuted);
    return () => {
      window.removeEventListener("workflow-executed", handleWorkflowExecuted);
    };
  }, [workflowId]);

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/executions`);
      const data = await response.json();

      if (data.ok && data.executions) {
        setExecutions(data.executions);
      } else {
        console.error("Failed to fetch executions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching executions:", error);
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  const handleViewDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "success") {
      return (
        <Badge className="bg-green-900/30 text-green-300 border-green-700/50">
          Success
        </Badge>
      );
    } else if (statusLower === "failure" || statusLower === "error") {
      return (
        <Badge className="bg-red-900/30 text-red-300 border-red-700/50">
          {status}
        </Badge>
      );
    } else if (statusLower === "running") {
      return (
        <Badge className="bg-blue-900/30 text-blue-300 border-blue-700/50">
          Running
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-800 text-gray-400 border-gray-700">
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>
            History of workflow runs and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExecutions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : executions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No executions yet. Run the workflow to see execution history.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Execution ID</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Started At</TableHead>
                  <TableHead className="text-white">Finished At</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-sm text-gray-300">
                      {execution.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    <TableCell className="text-gray-400">
                      {formatDateTime(execution.started_at)}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {execution.finished_at
                        ? formatDateTime(execution.finished_at)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(execution)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Execution Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              Input and output data for this execution
            </DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Input Data</h3>
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">
                    {JSON.stringify(selectedExecution.input_data || {}, null, 2)}
                  </code>
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Output Data</h3>
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-gray-300">
                    {JSON.stringify(selectedExecution.output_data || {}, null, 2)}
                  </code>
                </pre>
              </div>
              {selectedExecution.error && (
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
                  <pre className="bg-red-950/20 border border-red-800 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-red-300">
                      {selectedExecution.error}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

