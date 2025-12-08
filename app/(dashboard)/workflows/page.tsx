import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import WorkflowsTable from "@/components/workflows/WorkflowsTable";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import SubscriptionInactiveBanner from "@/components/subscription/SubscriptionInactiveBanner";
import { getWorkflow, PipedreamAPIError } from "@/lib/pipedreamClient";

export default async function WorkflowsPage() {
  // Authenticate user
  const session = await auth();

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  // Fetch workflows from database
  type WorkflowData = {
    id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    active: boolean;
    n8n_workflow_id: string | null;
  };

  let workflows: WorkflowData[] = [];
  let error: string | null = null;

  try {
    // First fetch workflows from database
    const dbWorkflows = await prisma.workflows.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
        updated_at: true,
        active: true,
        n8n_workflow_id: true,
      },
    });

    // Sync status from Pipedream for workflows that have Pipedream IDs
    for (const workflow of dbWorkflows) {
      if (workflow.n8n_workflow_id) {
        try {
          const pipedreamWorkflow = await getWorkflow(workflow.n8n_workflow_id);
          // Update workflow status from Pipedream
          if (workflow.active !== (pipedreamWorkflow.active || false)) {
            await prisma.workflows.update({
              where: { id: workflow.id },
              data: {
                active: pipedreamWorkflow.active || false,
                pipedream_deployment_state: pipedreamWorkflow.active ? "active" : "inactive",
              },
            });
            workflow.active = pipedreamWorkflow.active || false;
          }
        } catch (error) {
          // Log but don't fail - continue with database values
          if (error instanceof PipedreamAPIError) {
            console.warn(`Failed to sync workflow ${workflow.id} from Pipedream:`, error.message);
          }
        }
      }
    }

    workflows = dbWorkflows;
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error fetching workflows:", e);
    error = e.message || "Failed to load workflows";
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SubscriptionGate>
        <SubscriptionInactiveBanner />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
            <p className="text-gray-400">Manage your automation workflows.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/chat" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Create via Chat
              </Button>
            </Link>
          </div>
        </div>

        <WorkflowsTable workflows={workflows} error={error} />
      </SubscriptionGate>
    </div>
  );
}
