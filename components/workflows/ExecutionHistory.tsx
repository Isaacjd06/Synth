"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTime, formatStatus } from "@/lib/utils";

interface ExecutionOutputData {
  error?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Execution {
  id: string;
  workflow_id: string;
  user_id: string;
  input_data: Record<string, unknown> | null;
  output_data: ExecutionOutputData | null;
  status?: string | null;
  pipedream_execution_id?: string | null;
  created_at: string;
  finished_at: string | null;
}

interface ExecutionHistoryProps {
  executions: Execution[];
}

export default function ExecutionHistory({ executions }: ExecutionHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getStatus = (execution: Execution): "success" | "error" => {
    // Use status field if available, otherwise derive from output_data
    if (execution.status) {
      if (execution.status === "failure" || execution.status === "error") {
        return "error";
      }
      return "success";
    }
    // Fallback: derive from output_data
    if (execution.output_data?.error) {
      return "error";
    }
    return "success";
  };

  if (executions.length === 0) {
    return (
      <Card>
        <p className="text-gray-400">No executions yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Execution History</h2>
      {executions.map((execution) => {
        const isExpanded = expandedIds.has(execution.id);
        const status = getStatus(execution);

        return (
          <Card key={execution.id}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge variant={status} className="flex-shrink-0">
                    {formatStatus(status)}
                  </Badge>
                  <span className="text-xs sm:text-sm text-gray-400">
                    {formatDateTime(execution.created_at)}
                  </span>
                  {execution.finished_at && (
                    <span className="text-xs text-gray-500">
                      Finished: {formatDateTime(execution.finished_at)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(execution.id)}
                  className="text-gray-400 hover:text-white transition-colors self-end sm:self-auto flex-shrink-0"
                  aria-label={isExpanded ? "Collapse execution details" : "Expand execution details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
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
                      <pre className="bg-black/40 p-3 sm:p-4 rounded text-xs sm:text-sm overflow-x-auto text-gray-300">
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
                      <pre className="bg-black/40 p-3 sm:p-4 rounded text-xs sm:text-sm overflow-x-auto text-gray-300">
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
      })}
    </div>
  );
}

