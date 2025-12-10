"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Activity, Clock, CheckCircle, MessageSquare, Plus, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NextSuggestionCard from "@/components/dashboard/NextSuggestionCard";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  SubscriptionCallout,
  LockedButton,
  PlanLimitIndicator,
} from "@/app/(dashboard)/_components/subscription";

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

const statusColors: Record<StatusKey, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  running: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  failure: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DashboardPage() {
  const { isSubscribed, plan, usage, openSubscriptionModal } = useSubscription();
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
            console.log("Onboarding data committed successfully");
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
        const response = await fetch("/api/dashboard/updates");
        const data = await response.json();
        
        if (data.ok) {
          setStats({
            activeWorkflows: data.stats.activeWorkflows || 0,
            totalExecutions: data.stats.totalExecutions || 0,
            executionsLast24h: data.stats.executionsLast24h || 0,
            successRate: data.stats.successRate || 0,
          });
          setRecentExecutions(data.recentExecutions || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const hasExecutions = recentExecutions.length > 0;
  const hasAutomations = stats.activeWorkflows > 0;

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

  return (
    <AppShell>
      <PageTransition className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
        {/* Subscription Banner - non-dismissible warning for unsubscribed */}
        {!isSubscribed && (
          <PageItem>
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    You are not subscribed. Your account is in read-only mode until you subscribe.
                  </h4>
                </div>
              </div>
            </div>
          </PageItem>
        )}

        {/* Page Header */}
        <PageItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 font-light">
              Synth is monitoring your operations. Here's your system overview.
            </p>
          </div>
        </PageItem>

        {/* Subscription Callout for unsubscribed users */}
        {!isSubscribed && (
          <PageItem>
            <SubscriptionCallout
              title="Subscription Required"
              subtitle="Workflows, executions, and integrations are locked. Subscribe to unlock full access to Synth's automation platform."
              onUpgradeClick={() => openSubscriptionModal()}
            />
          </PageItem>
        )}

        {/* Statistics Grid - 2x2 */}
        <PageItem>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-muted mb-3" />
                    <div className="h-8 bg-muted rounded mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  label: "Active Automations", 
                  value: stats.activeWorkflows,
                  icon: Zap,
                  color: "text-primary",
                  bgColor: "bg-primary/10 border-primary/20"
                },
                { 
                  label: "Total Executions", 
                  value: stats.totalExecutions.toLocaleString(),
                  icon: Activity,
                  color: "text-emerald-400",
                  bgColor: "bg-emerald-500/10 border-emerald-500/20"
                },
                { 
                  label: "Activity (24h)", 
                  value: stats.executionsLast24h,
                  icon: Clock,
                  color: "text-amber-400",
                  bgColor: "bg-amber-500/10 border-amber-500/20"
                },
                { 
                  label: "Execution Reliability", 
                  value: `${stats.successRate.toFixed(1)}%`,
                  icon: CheckCircle,
                  color: "text-cyan-400",
                  bgColor: "bg-cyan-500/10 border-cyan-500/20"
                },
              ].map((stat) => (
              <Card key={stat.label} className="group relative overflow-hidden hover:border-primary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 -mr-6 -mt-6 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bgColor} border flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-light">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </PageItem>

        {/* Recent Activity */}
        <PageItem>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                  <Link href="/app/executions" className="flex items-center gap-1">
                    View All
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {hasExecutions ? (
                <div className="divide-y divide-border/40">
                  {recentExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between py-3.5 px-5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {execution.workflow?.name || "Unknown Workflow"}
                        </span>
                        <Badge className={`${statusColors[execution.status as StatusKey] || statusColors.error} text-xs`}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-muted-foreground font-light">
                          {formatTimeAgo(execution.created_at)}
                        </span>
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                          <Link href={`/app/workflows/${execution.workflow_id}`}>
                            View
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-light mb-4">
                    No recent activity to display.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/app/chat">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      Create your first automation
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </PageItem>

        {/* Next Suggestion Card */}
        <PageItem>
          <NextSuggestionCard />
        </PageItem>

        {/* Synth Advisory Panel */}
        <PageItem>
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                Synth Advisory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <p className="text-sm text-muted-foreground font-light">
                Synth is observing your workflows and ready to provide intelligent recommendations. Start a conversation to optimize your operations.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/app/chat">
                  Open Chat
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </PageItem>

        {/* Usage Limits Indicator for subscribed users */}
        {isSubscribed && usage && (
          <PageItem>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usage.activeWorkflowsLimit !== null && (
                  <PlanLimitIndicator
                    label="Active Workflows"
                    used={usage.activeWorkflowsUsed || 0}
                    limit={usage.activeWorkflowsLimit}
                  />
                )}
                {usage.executionsLimit !== null && (
                  <PlanLimitIndicator
                    label="Executions"
                    used={usage.executionsUsed || 0}
                    limit={usage.executionsLimit}
                  />
                )}
              </CardContent>
            </Card>
          </PageItem>
        )}

        {/* Quick Actions */}
        <PageItem className="flex flex-wrap gap-3">
          {isSubscribed ? (
            <>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/app/chat">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Automation
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-border/50 hover:border-primary/30">
                <Link href="/app/workflows">
                  <Zap className="w-4 h-4 mr-1.5" />
                  View Workflows
                </Link>
              </Button>
            </>
          ) : (
            <>
              <LockedButton
                reason="Subscribe to create automations"
                onUpgradeClick={() => openSubscriptionModal()}
              >
                Create Automation
              </LockedButton>
              <Button variant="outline" asChild className="border-border/50 hover:border-primary/30">
                <Link href="/app/workflows">
                  <Zap className="w-4 h-4 mr-1.5" />
                  View Workflows
                </Link>
              </Button>
            </>
          )}
        </PageItem>
      </PageTransition>
    </AppShell>
  );
}
