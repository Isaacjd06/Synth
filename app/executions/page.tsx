import Card from "@/components/ui/Card";
import ExecutionRow from "@/components/executions/ExecutionRow";

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

export default async function ExecutionsPage() {
  let executions: Execution[] = [];
  let error: string | null = null;

  try {
    executions = await getExecutions();
  } catch (err) {
    error = "Failed to load executions.";
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Executions</h1>
        <p className="text-gray-400 text-sm">
          Recent workflow runs across Synth.
          {executions.length > 0 && (
            <span className="ml-2 text-gray-500">
              Showing {executions.length} {executions.length === 1 ? "execution" : "executions"}
            </span>
          )}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!error && executions.length === 0 && (
        <Card>
          <p className="text-gray-400">No executions yet. Run a workflow to see history here.</p>
        </Card>
      )}

      {/* Executions List */}
      {!error && executions.length > 0 && (
        <div className="space-y-4">
          {executions.map((execution) => (
            <ExecutionRow key={execution.id} execution={execution} />
          ))}
        </div>
      )}
    </div>
  );
}

