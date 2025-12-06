import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import ExecutionsTable from "@/components/executions/ExecutionsTable";
import ExecutionsHeader from "@/components/executions/ExecutionsHeader";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

export default async function ExecutionsPage() {
  // Authenticate and validate admin user
  const session = await auth();

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  if (session.user.id !== SYSTEM_USER_ID) {
    redirect("/");
  }

  // Fetch recent executions with workflow join
  type ExecutionData = {
    id: string;
    workflow_id: string;
    user_id: string;
    input_data: any;
    output_data: any;
    status: string | null;
    pipedream_execution_id: string | null;
    created_at: Date;
    finished_at: Date | null;
    workflow: {
      id: string;
      name: string;
    };
  };

  let executions: ExecutionData[] = [];
  let error: string | null = null;

  try {
    executions = await prisma.execution.findMany({
      where: {
        user_id: session.user.id,
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50, // Limit to 50 most recent
    });
  } catch (err: any) {
    console.error("Error fetching executions:", err);
    error = err.message || "Failed to load executions";
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Executions</h1>
        <p className="text-gray-400">
          View execution history across all your workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Most recent workflow executions across your Synth account.
              </CardDescription>
            </div>
            <ExecutionsHeader />
          </div>
        </CardHeader>
        <CardContent>
          <ExecutionsTable executions={executions} error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
