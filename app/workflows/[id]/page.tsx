import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import RunWorkflowButton from "@/components/workflows/RunWorkflowButton";
import ExecutionHistory from "@/components/workflows/ExecutionHistory";
import { formatStatus } from "@/lib/utils";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
  trigger?: any;
  actions?: any;
}

interface Execution {
  id: string;
  workflow_id: string;
  user_id: string;
  input_data: any;
  output_data: any;
  status?: string | null;
  created_at: string;
  finished_at: string | null;
}

async function getWorkflows(): Promise<Workflow[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/workflows/list`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch workflows");
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return [];
  }
}

async function getExecutions(): Promise<Execution[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/executions`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch executions");
    }

    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching executions:", error);
    return [];
  }
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [workflows, executions] = await Promise.all([
    getWorkflows(),
    getExecutions(),
  ]);

  const workflow = workflows.find((w) => w.id === params.id);

  if (!workflow) {
    notFound();
  }

  const workflowExecutions = executions.filter(
    (e) => e.workflow_id === workflow.id
  );

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6 w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-white break-words">{workflow.name}</h1>
            <Badge variant={workflow.active ? "active" : "inactive"} className="self-start sm:self-auto">
              {formatStatus(workflow.active ? "active" : "inactive")}
            </Badge>
          </div>
          {workflow.description && (
            <p className="text-gray-400 text-sm sm:text-base break-words">{workflow.description}</p>
          )}
        </div>

        {/* Run Workflow Button */}
        <div>
          <RunWorkflowButton workflowId={workflow.id} />
        </div>

        {/* Metadata Section */}
        <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Workflow Metadata</h2>
        <div className="space-y-4">
          {/* Trigger */}
          {workflow.trigger && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Trigger</h3>
              <pre className="bg-black/40 p-3 sm:p-4 rounded text-xs sm:text-sm overflow-x-auto text-gray-300">
                {JSON.stringify(workflow.trigger, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          {workflow.actions && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Actions</h3>
              <pre className="bg-black/40 p-3 sm:p-4 rounded text-xs sm:text-sm overflow-x-auto text-gray-300">
                {JSON.stringify(workflow.actions, null, 2)}
              </pre>
            </div>
          )}

          {/* No metadata message */}
          {!workflow.trigger && !workflow.actions && (
            <p className="text-gray-400 text-sm">No metadata available.</p>
          )}
        </div>
      </Card>

        {/* Execution History */}
        <ExecutionHistory executions={workflowExecutions} />
      </div>
    </div>
  );
}

