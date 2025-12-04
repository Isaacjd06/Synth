import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WorkflowCard from "@/components/workflows/WorkflowCard";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at?: string;
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
    throw error;
  }
}

export default async function WorkflowsPage() {
  let workflows: Workflow[] = [];
  let error: string | null = null;

  try {
    workflows = await getWorkflows();
  } catch (err) {
    error = "Failed to load workflows.";
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Workflows</h1>
          <p className="text-gray-400 text-sm">Manage your automation workflows.</p>
        </div>
        <Link href="/workflows/create">
          <Button variant="primary">+ Create Workflow</Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!error && workflows.length === 0 && (
        <Card>
          <p className="text-gray-400">No workflows yet. Create your first one.</p>
        </Card>
      )}

      {/* Workflows Grid */}
      {!error && workflows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              id={workflow.id}
              name={workflow.name}
              description={workflow.description}
              active={workflow.active}
            />
          ))}
        </div>
      )}
    </div>
  );
}

