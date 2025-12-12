"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Lock, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import {
  LockedButton,
  ReadOnlyBadge,
  PlanLimitIndicator,
} from "@/app/(dashboard)/_components/subscription";
import { synthToast } from "@/lib/synth-toast";
import { cn } from "@/lib/utils";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  lastRun: string | null;
  runCount: number;
  readOnly: boolean;
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
      const response = await fetch("/api/workflows");
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        toast.error("Unexpected response from server. Please try again.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // API returns array directly
        setWorkflows(data || []);
      } else {
        try {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to load workflows");
        } catch {
          toast.error(`Failed to load workflows (${response.status})`);
        }
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isSubscribed) {
      synthToast.error("Subscription Required", "Subscribe to activate workflows.");
      return;
    }

    const workflow = workflows.find(w => w.id === id);
    const willBeActive = !currentStatus;
    
    // Check if at workflow limit when trying to activate
    if (willBeActive && usage && usage.activeWorkflowsLimit !== null) {
      const activeCount = workflows.filter(w => w.active).length;
      if (activeCount >= usage.activeWorkflowsLimit) {
        synthToast.error("Workflow Limit Reached", "Upgrade your plan to activate more workflows.");
        return;
      }
    }
    
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
          if (workflow) {
            synthToast.success("Workflow Activated", `"${workflow.name}" is now running.`);
          }
        } else {
          const data = await response.json();
          synthToast.error("Activation Failed", data.error || "Failed to activate workflow");
        }
      } else {
        // For deactivation, we'd need a deactivate endpoint or update endpoint
        // For now, just show a message
        if (workflow) {
          synthToast.warning("Workflow Paused", `"${workflow.name}" has been deactivated.`);
        }
      }
    } catch (error) {
      synthToast.error("Error", "Failed to update workflow status");
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

  const activeCount = workflows.filter(w => w.active).length;
  const maxWorkflows = usage?.activeWorkflowsLimit || 3;
  const isAtWorkflowLimit = isSubscribed && activeCount >= maxWorkflows;
  const planTier = usage?.plan || "none";
  const upgradePlan = planTier === "starter" ? "Pro" : planTier === "pro" ? "Agency" : null;

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Subscription Banner */}
        {!isSubscribed && (
          <PageItem>
            <SubscriptionBanner feature="activate and manage workflows" />
          </PageItem>
        )}

        {/* Plan Limit Indicator for subscribed users */}
        {isSubscribed && usage && usage.activeWorkflowsLimit !== null && (
          <PageItem>
            <Card className="border-border/50">
              <CardContent className="py-4">
                <PlanLimitIndicator
                  label="Active Workflows"
                  used={usage.activeWorkflowsUsed || 0}
                  limit={usage.activeWorkflowsLimit}
                />
              </CardContent>
            </Card>
          </PageItem>
        )}

        {/* Header */}
        <PageItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Workflows
            </h1>
            <p className="text-muted-foreground mt-2 font-light">
              Manage your automations. Synth will optimize them over time.
            </p>
          </div>
          
          <TooltipProvider>
            {isSubscribed && !isAtWorkflowLimit ? (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/app/chat">Create Workflow</Link>
              </Button>
            ) : isSubscribed && isAtWorkflowLimit ? (
              <div className="flex flex-col items-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="opacity-40 cursor-not-allowed locked-button" disabled>
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Workflow limit reached ({activeCount}/{maxWorkflows})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Upgrade for more workflows</p>
                  </TooltipContent>
                </Tooltip>
                {upgradePlan && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openSubscriptionModal()}
                    className="text-xs text-primary hover:text-primary h-auto py-1"
                  >
                    Upgrade to {upgradePlan} for more
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            ) : (
              <LockedButton feature="create workflows">
                Create Workflow
              </LockedButton>
            )}
          </TooltipProvider>
        </PageItem>

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
            <Card className="border-dashed border-2 border-border/50 bg-card/50">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Workflows Yet
                </h3>
                <p className="text-muted-foreground mb-6 font-light max-w-md mx-auto">
                  Create your first automation in one click. Use the chat to describe what you want, or build it manually.
                </p>
                <LockedButton className="bg-primary hover:bg-primary/90" feature="create workflows">
                  Create Workflow
                </LockedButton>
              </CardContent>
            </Card>
          </PageItem>
        ) : (
          /* Workflows List */
          <PageItem>
            <TooltipProvider>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {workflows.map((workflow) => {
                      // Show limit warning on inactive workflows if at limit
                      const showLimitWarning = isSubscribed && isAtWorkflowLimit && !workflow.active;
                      
                      return (
                        <div
                          key={workflow.id}
                          className={cn(
                            "flex items-center justify-between p-4 transition-colors",
                            !isSubscribed ? "opacity-60" : "hover:bg-muted/40"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {workflow.name}
                              </p>
                              {(!isSubscribed || workflow.readOnly) && <ReadOnlyBadge size="sm" />}
                            </div>
                            <p className="text-sm text-muted-foreground font-light">
                              {workflow.lastRun 
                                ? `Last run: ${formatTimeAgo(workflow.lastRun)}`
                                : "Never run"}
                              {workflow.runCount > 0 && ` • ${workflow.runCount} run${workflow.runCount !== 1 ? 's' : ''}`}
                            </p>
                            {showLimitWarning && (
                              <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                Inactive — Upgrade to activate more workflows
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <Badge
                              className={workflow.active 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-muted/50 text-muted-foreground border-border/50"
                              }
                            >
                              {workflow.active ? "Active" : "Inactive"}
                            </Badge>

                            {isSubscribed ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(workflow.id, workflow.active)}
                                disabled={showLimitWarning}
                                className={cn(
                                  "border-border/50 hover:border-primary/30",
                                  showLimitWarning && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {workflow.active ? "Deactivate" : "Activate"}
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="opacity-40 cursor-not-allowed locked-button"
                                  >
                                    <Lock className="w-3 h-3 mr-1.5" />
                                    {workflow.active ? "Deactivate" : "Activate"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Subscribe to manage workflows</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/app/workflows/${workflow.id}`}>
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TooltipProvider>
          </PageItem>
        )}
        </div>
      </PageTransition>
  );
}
