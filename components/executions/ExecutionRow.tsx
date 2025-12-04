"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Execution {
  id: string;
  workflow_id: string;
  user_id: string;
  input_data: any;
  output_data: any;
  created_at: string;
  finished_at: string | null;
  workflow?: {
    id: string;
    name: string;
  };
}

interface ExecutionRowProps {
  execution: Execution;
}

export default function ExecutionRow({ execution }: ExecutionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatus = (execution: Execution): "success" | "error" => {
    if (execution.output_data?.error) {
      return "error";
    }
    if (execution.finished_at) {
      return "success";
    }
    return "success"; // Default to success if no error
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getWorkflowName = (execution: Execution): string => {
    return execution.workflow?.name || `Workflow: ${execution.workflow_id.substring(0, 8)}...`;
  };

  const status = getStatus(execution);

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Badge variant={status}>
              {status === "success" ? "Completed" : "Error"}
            </Badge>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/workflows/${execution.workflow_id}`}
                  className="font-semibold text-white hover:text-[#194c92] transition-colors"
                >
                  {getWorkflowName(execution)}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Started: {formatDate(execution.created_at)}</span>
                {execution.finished_at && (
                  <span>Finished: {formatDate(execution.finished_at)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/workflows/${execution.workflow_id}`}
              className="text-sm text-[#194c92] hover:text-[#1a5ba8] transition-colors"
            >
              View Workflow
            </Link>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={isExpanded ? "Collapse execution details" : "Expand execution details"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            {/* Input Data */}
            {execution.input_data && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Input Data
                </h3>
                <pre className="bg-black/40 p-4 rounded text-sm overflow-x-auto text-gray-300">
                  {JSON.stringify(execution.input_data, null, 2)}
                </pre>
              </div>
            )}

            {/* Output Data */}
            {execution.output_data && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Output Data
                </h3>
                <pre className="bg-black/40 p-4 rounded text-sm overflow-x-auto text-gray-300">
                  {JSON.stringify(execution.output_data, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Message */}
            {execution.output_data?.error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
                <strong>Error:</strong> {execution.output_data.error}
                {execution.output_data.details && (
                  <pre className="mt-2 text-xs">
                    {JSON.stringify(execution.output_data.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

