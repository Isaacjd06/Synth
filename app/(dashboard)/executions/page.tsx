"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, MessageSquare, Zap, Lock, RefreshCw, Loader2 } from "lucide-react";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import {
  LockedButton,
  LogRetentionWarning,
} from "@/app/(dashboard)/_components/subscription";
import { synthToast } from "@/lib/synth-toast";

type StatusKey = "success" | "running" | "error" | "failure";
const statusVariants: Record<StatusKey, "success" | "running" | "error"> = {
  success: "success", running: "running", error: "error", failure: "error",
};

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  createdAt: string;
  durationMs: number | null;
  errorMessage: string | null;
}

export default function ExecutionsPage() {
  const { isSubscribed, requireSubscription } = useSubscription();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/executions");
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          synthToast.error("Error", "Unexpected response from server. Please try again.");
          setLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          // API returns array directly
          setExecutions(data || []);
        } else {
          try {
            const errorData = await response.json();
            synthToast.error("Failed to load executions", errorData.error || "Unknown error");
          } catch {
            synthToast.error("Error", `Failed to load executions (${response.status})`);
          }
        }
      } catch (error) {
        console.error("Error fetching executions:", error);
        synthToast.error("Error", "Failed to load executions");
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();
  }, []);

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

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleRetryExecution = async (executionId: string) => {
    if (!requireSubscription("retry executions")) return;
    
    try {
      const response = await fetch(`/api/executions/${executionId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        synthToast.error("Retry Failed", "Unexpected response from server. Please try again.");
        return;
      }

      const data = await response.json();
      
      if (data && data.ok && data.data) {
        synthToast.success("Execution Retried", "Workflow is now running again.");
        // Refresh executions list
        const refreshResponse = await fetch("/api/executions");
        const refreshContentType = refreshResponse.headers.get("content-type");
        if (refreshResponse.ok && refreshContentType && refreshContentType.includes("application/json")) {
          const refreshData = await refreshResponse.json();
          setExecutions(refreshData || []);
        }
      } else {
        synthToast.error("Retry Failed", data.error || "Failed to retry execution");
      }
    } catch (error) {
      synthToast.error("Error", "Failed to retry execution");
    }
  };

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-8">
        {!isSubscribed && (
          <PageItem>
            <SubscriptionBanner feature="access execution tools" />
          </PageItem>
        )}

        <PageItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              Executions
            </h1>
            <p className="text-muted-foreground mt-2 font-light">
              Monitor your workflow activity. Synth tracks every operation.
            </p>
          </div>
        </PageItem>

        {loading ? (
          <PageItem>
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading executions...</p>
              </CardContent>
            </Card>
          </PageItem>
        ) : executions.length === 0 ? (
          <PageItem>
            <Card className="border-dashed border-2 border-border/50 bg-card/50">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Executions Yet</h3>
                <p className="text-muted-foreground mb-6 font-light max-w-md mx-auto">
                  When you run a workflow, execution history will appear here. Create a workflow and run it to get started.
                </p>
                <div className="flex justify-center gap-3">
                  <LockedButton className="bg-primary hover:bg-primary/90" feature="create workflows">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create Workflow
                  </LockedButton>
                  <Button variant="outline" asChild>
                    <Link href="/app/workflows"><Zap className="w-4 h-4 mr-2" />View Workflows</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PageItem>
        ) : (
          <PageItem>
            <TooltipProvider>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {executions.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-4 synth-row">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{execution.workflowName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 font-light">
                            <span>{formatTimeAgo(execution.createdAt)}</span>
                            <span>•</span>
                            <span className="font-mono">{formatDuration(execution.durationMs)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Badge variant={statusVariants[execution.status as StatusKey] || "error"}>{execution.status}</Badge>
                          {(execution.status === "error" || execution.status === "failure") && (
                            isSubscribed ? (
                              <Button variant="outline" size="sm" onClick={() => handleRetryExecution(execution.id)} className="gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" />Retry
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" className="opacity-40 cursor-not-allowed gap-1.5 locked-button" disabled>
                                    <Lock className="w-3 h-3" />Retry
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-xs">Subscribe to retry executions</p></TooltipContent>
                              </Tooltip>
                            )
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/app/executions/${execution.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TooltipProvider>
          </PageItem>
        )}

        {isSubscribed && (
          <PageItem>
            <LogRetentionWarning />
          </PageItem>
        )}
        </div>
      </PageTransition>
  );
}
