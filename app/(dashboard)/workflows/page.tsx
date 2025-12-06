import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import WorkflowsTable from "@/components/workflows/WorkflowsTable";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export default async function WorkflowsPage() {
  // Authenticate and validate admin user
  const session = await auth();

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  if (session.user.id !== SYSTEM_USER_ID) {
    redirect("/");
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
    workflows = await prisma.workflows.findMany({
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
  } catch (err: any) {
    console.error("Error fetching workflows:", err);
    error = err.message || "Failed to load workflows";
  }

  return (
    <div className="max-w-7xl mx-auto">
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
    </div>
  );
}
