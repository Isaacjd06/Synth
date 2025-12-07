"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { JsonValue } from "@prisma/client/runtime/library";

interface Execution {
  id: string;
  workflow_id: string;
  user_id: string;
  input_data: JsonValue;
  output_data: JsonValue;
  status: string | null;
  pipedream_execution_id: string | null;
  created_at: Date;
  finished_at: Date | null;
  workflow: {
    id: string;
    name: string;
  };
}

interface ExecutionsTableProps {
  executions: Execution[];
  error: string | null;
}

export default function ExecutionsTable({ executions, error }: ExecutionsTableProps) {
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (execution: Execution) => {
    setSelectedExecution(execution);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge className="bg-gray-800 text-gray-400 border-gray-700">
          Unknown
        </Badge>
      );
    }

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
    } else if (statusLower === "running" || statusLower === "pending") {
      return (
        <Badge className="bg-blue-900/30 text-blue-300 border-blue-700/50">
          {status}
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-800 text-gray-400 border-gray-700">
        {status}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
        <p className="text-red-400">Error loading executions: {error}</p>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No executions found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white">Workflow Name</TableHead>
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
              <TableCell className="font-medium text-white">
                <Link
                  href={`/workflows/${execution.workflow_id}`}
                  className="hover:text-blue-400 transition-colors"
                >
                  {execution.workflow.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-gray-300">
                {execution.id.slice(0, 8)}...
              </TableCell>
              <TableCell>{getStatusBadge(execution.status)}</TableCell>
              <TableCell className="text-gray-400">
                {formatDateTime(execution.created_at)}
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

      {/* Execution Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              Detailed information about this workflow execution
            </DialogDescription>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Workflow</h3>
                  <Link
                    href={`/workflows/${selectedExecution.workflow_id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {selectedExecution.workflow.name}
                  </Link>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Status</h3>
                  {getStatusBadge(selectedExecution.status)}
                </div>
              </div>
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
              {selectedExecution.status &&
                (selectedExecution.status.toLowerCase() === "error" ||
                  selectedExecution.status.toLowerCase() === "failure") && (
                  <div>
                    <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
                    <pre className="bg-red-950/20 border border-red-800 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-red-300">
                        {JSON.stringify(selectedExecution.output_data || {}, null, 2)}
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

