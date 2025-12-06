import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import WorkflowRunButton from "@/components/workflows/WorkflowRunButton";
import WorkflowExecutions from "@/components/workflows/WorkflowExecutions";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import SubscriptionInactiveBanner from "@/components/subscription/SubscriptionInactiveBanner";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Authenticate user
  const session = await auth();

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  // Fetch workflow from database
  const workflow = await prisma.workflows.findUnique({
    where: {
      id: id,
      user_id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      trigger: true,
      actions: true,
      n8n_workflow_id: true,
      active: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!workflow) {
    redirect("/workflows");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SubscriptionGate>
        <SubscriptionInactiveBanner />
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-gray-400 mb-3">{workflow.description}</p>
            )}
            <div className="flex items-center gap-3">
              {workflow.active ? (
                <Badge className="bg-green-900/30 text-green-300 border-green-700/50">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-gray-800 text-gray-400 border-gray-700">
                  Inactive
                </Badge>
              )}
              {workflow.n8n_workflow_id && (
                <span className="text-sm text-gray-500 font-mono">
                  Pipedream ID: {workflow.n8n_workflow_id}
                </span>
              )}
            </div>
          </div>
          <WorkflowRunButton workflowId={workflow.id} n8nWorkflowId={workflow.n8n_workflow_id} />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Trigger Section */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger</CardTitle>
            <CardDescription>
              The event or condition that starts this workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflow.trigger ? (
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">
                  {JSON.stringify(workflow.trigger, null, 2)}
                </code>
              </pre>
            ) : (
              <p className="text-gray-400 italic">No trigger configured</p>
            )}
          </CardContent>
        </Card>

        {/* Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Steps executed when the workflow runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflow.actions && Array.isArray(workflow.actions) && workflow.actions.length > 0 ? (
              <div className="space-y-4">
                {workflow.actions.map((action: any, index: number) => (
                  <div key={index} className="border border-gray-800 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Action {index + 1}
                      </span>
                      {action.type && (
                        <span className="ml-2 text-xs text-gray-500">
                          Type: {action.type}
                        </span>
                      )}
                      {action.app && (
                        <span className="ml-2 text-xs text-gray-500">
                          App: {action.app}
                        </span>
                      )}
                      {action.operation && (
                        <span className="ml-2 text-xs text-gray-500">
                          Operation: {action.operation}
                        </span>
                      )}
                    </div>
                    <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto mt-2">
                      <code className="text-sm text-gray-300">
                        {JSON.stringify(action, null, 2)}
                      </code>
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No actions configured</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Executions Section */}
        <WorkflowExecutions workflowId={workflow.id} />
      </div>
      </SubscriptionGate>
    </div>
  );
}
