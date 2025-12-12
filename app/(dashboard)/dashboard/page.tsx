"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Activity, Clock, CheckCircle, ChevronRight, Sparkles } from "lucide-react";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import DashboardWarningBanner from "@/components/dashboard/DashboardWarningBanner";
import DashboardSuggestionCard from "@/components/dashboard/DashboardSuggestionCard";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import DashboardActivityRow from "@/components/dashboard/DashboardActivityRow";
import DashboardAdvisoryCard from "@/components/dashboard/DashboardAdvisoryCard";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface DashboardStats {
  activeWorkflows: number;
  totalExecutions: number;
  executionsLast24h: number;
  successRate: number;
}

interface RecentExecution {
  id: string;
  workflow_id: string;
  status: string;
  created_at: Date | string;
  workflow: {
    id: string;
    name: string;
  };
}

type StatusKey = "success" | "running" | "error" | "failure";

const statusVariants: Record<StatusKey, "success" | "running" | "error"> = {
  success: "success",
  running: "running",
  error: "error",
  failure: "error",
};

export default function DashboardPage() {
  const { isSubscribed } = useSubscription();
  const [stats, setStats] = useState<DashboardStats>({
    activeWorkflows: 0,
    totalExecutions: 0,
    executionsLast24h: 0,
    successRate: 0,
  });
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [loading, setLoading] = useState(true);

  // Commit onboarding data if it exists (after Google sign-in)
  useEffect(() => {
    const commitOnboardingData = async () => {
      try {
        const response = await fetch("/api/onboarding/commit", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.imported) {
          }
        } else if (response.status === 404) {
          // No onboarding data found, which is fine
          // This happens if user didn't go through onboarding or already committed
        }
      } catch (error) {
        // Silently fail - don't block dashboard load if commit fails
        console.error("Error committing onboarding data:", error);
      }
    };

    commitOnboardingData();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryResponse, executionsResponse] = await Promise.all([
          fetch("/api/dashboard/summary"),
          fetch("/api/executions?limit=5"),
        ]);
        
        // Handle summary data
        const summaryContentType = summaryResponse.headers.get("content-type");
        if (summaryResponse.ok && summaryContentType && summaryContentType.includes("application/json")) {
          const summaryData = await summaryResponse.json();
          if (summaryData.ok && summaryData.stats) {
            setStats({
              activeWorkflows: summaryData.stats.activeWorkflows || 0,
              totalExecutions: summaryData.stats.totalExecutions || 0,
              executionsLast24h: summaryData.stats.executionsLast24h || 0,
              successRate: summaryData.stats.successRate || 0,
            });
          }
        }

        // Handle recent executions
        const executionsContentType = executionsResponse.headers.get("content-type");
        if (executionsResponse.ok && executionsContentType && executionsContentType.includes("application/json")) {
          const executionsData = await executionsResponse.json();
          if (Array.isArray(executionsData)) {
            setRecentExecutions(executionsData.map((exec: any) => ({
              id: exec.id,
              workflow_id: exec.workflowId,
              status: exec.status,
              created_at: exec.createdAt,
              workflow: {
                id: exec.workflowId,
                name: exec.workflowName,
              },
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const statCards = [
    { label: "Active Automations", value: stats.activeWorkflows, icon: Zap },
    { label: "Total Executions", value: stats.totalExecutions.toLocaleString(), icon: Activity },
    { label: "Activity (24h)", value: stats.executionsLast24h, icon: Clock },
    { label: "Execution Reliability", value: `${stats.successRate.toFixed(1)}%`, icon: CheckCircle },
  ];

  const recentActivity = recentExecutions.map((execution) => ({
    workflow: execution.workflow?.name || "Unknown Workflow",
    status: (execution.status === "success" ? "success" : execution.status === "running" ? "running" : "error") as const,
    duration: "—", // TODO: Add duration from backend
    timestamp: formatTimeAgo(execution.created_at),
    workflowId: execution.workflow_id,
  }));

  return (
    <TooltipProvider>
      <PageTransition className="max-w-7xl mx-auto">
        <div className="space-y-10">
          
          {/* 1. Subscription Warning Banner */}
          {!isSubscribed && (
            <PageItem>
              <DashboardWarningBanner />
            </PageItem>
          )}

          {/* 2. Page Header */}
          <PageItem>
            <div className="space-y-3">
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Dashboard
              </h1>
              <p className="text-muted-foreground font-light text-base pl-14">
                Synth is monitoring your operations. Here's your system overview.
              </p>
            </div>
          </PageItem>

          {/* 3. Synth Suggestion Section */}
          <PageItem>
            <DashboardSuggestionCard />
          </PageItem>

          {/* Section Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
            </div>
          </div>

          {/* 4. Metrics Row - 4 Stat Cards */}
          <PageItem>
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-11 w-11 rounded-xl bg-muted mb-4" />
                      <div className="h-8 bg-muted rounded mb-1.5" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat) => (
                  <DashboardStatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                  />
                ))}
              </div>
            )}
          </PageItem>

          {/* 5. Recent Activity Section */}
          <PageItem>
            <Card className="overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
              <CardHeader className="border-b border-border/30 bg-muted/10 px-5 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2.5">
                    <Activity className="w-4.5 h-4.5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8 px-3" asChild>
                    <Link href="/app/executions">
                      View All
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-border/20">
                    {recentActivity.map((activity, index) => (
                      <DashboardActivityRow
                        key={index}
                        workflow={activity.workflow}
                        status={activity.status}
                        duration={activity.duration}
                        timestamp={activity.timestamp}
                        workflowId={activity.workflowId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-light">No workflow activity found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageItem>

          {/* 6. Synth Advisory Section */}
          <PageItem>
            <DashboardAdvisoryCard />
          </PageItem>

        </div>
      </PageTransition>
    </TooltipProvider>
  );
}
