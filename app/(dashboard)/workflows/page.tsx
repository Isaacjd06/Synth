"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  SubscriptionBanner,
  LockedButton,
  ReadOnlyBadge,
  PlanLimitIndicator,
} from "@/app/(dashboard)/_components/subscription";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  n8n_workflow_id: string | null;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { isSubscribed, usage, openSubscriptionModal } = useSubscription();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows/list");
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data || []);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      // If activating, use the activate endpoint
      if (!currentStatus) {
        const response = await fetch(`/api/workflows/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setWorkflows((prev) =>
            prev.map((w) =>
              w.id === id ? { ...w, active: true } : w
            )
          );
          toast.success("Workflow activated");
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to activate workflow");
        }
      } else {
        // For deactivation, we'd need a deactivate endpoint or update endpoint
        // For now, just show a message
        toast.info("Deactivation requires workflow update endpoint");
      }
    } catch (error) {
      toast.error("Failed to update workflow status");
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <AppShell>
      <PageTransition className="px-4 lg:px-6 py-8 space-y-8">
        {/* Subscription Banner for unsubscribed */}
        {!isSubscribed && (
          <PageItem>
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    Execution tools require an active subscription. You can view workflows but cannot create or run them.
                  </h4>
                </div>
              </div>
            </div>
          </PageItem>
        )}

        {/* Header */}
        <PageItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gradient synth-header">
              Workflows
            </h1>
            <p className="text-muted-foreground mt-2 font-light">
              Manage your automations. Synth will optimize them over time.
            </p>
          </div>
          {isSubscribed ? (
            <Button asChild className="btn-synth">
              <Link href="/app/chat">Create Workflow</Link>
            </Button>
          ) : (
            <LockedButton
              reason="Subscribe to create workflows"
              onUpgradeClick={() => openSubscriptionModal()}
              className="btn-synth"
            >
              Create Workflow (Locked)
            </LockedButton>
          )}
        </PageItem>

        {/* Usage Limits for subscribed users */}
        {isSubscribed && usage && usage.activeWorkflowsLimit !== null && (
          <PageItem>
            <Card>
              <CardContent className="p-4">
                <PlanLimitIndicator
                  label="Active Workflows"
                  used={usage.activeWorkflowsUsed || 0}
                  limit={usage.activeWorkflowsLimit}
                />
              </CardContent>
            </Card>
          </PageItem>
        )}

        {/* Loading State */}
        {loading ? (
          <PageItem>
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading workflows...</p>
              </CardContent>
            </Card>
          </PageItem>
        ) : workflows.length === 0 ? (
          /* Empty State */
          <PageItem>
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-6 font-light">
                  Synth is ready. Create your first automation to begin optimizing your operations.
                </p>
                <Button asChild className="btn-synth">
                  <Link href="/app/chat">Create Workflow</Link>
                </Button>
              </CardContent>
            </Card>
          </PageItem>
        ) : (
          /* Workflows List */
          <PageItem>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`flex items-center justify-between p-4 synth-row ${
                        !isSubscribed ? "opacity-75" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {workflow.name}
                          </p>
                          {!isSubscribed && <ReadOnlyBadge />}
                        </div>
                        <p className="text-sm text-muted-foreground font-light">
                          Created {formatTimeAgo(workflow.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <Badge
                          variant={workflow.active ? "default" : "secondary"}
                        >
                          {workflow.active ? "Active" : "Inactive"}
                        </Badge>

                        {isSubscribed ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(workflow.id, workflow.active)}
                            >
                              {workflow.active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/app/workflows/${workflow.id}`}>View</Link>
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/app/workflows/${workflow.id}`}>View</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PageItem>
        )}
      </PageTransition>
    </AppShell>
  );
}
