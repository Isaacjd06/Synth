"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import InsightFilterSidebar, { InsightFilter } from "@/components/insights/InsightFilterSidebar";
import InsightsList from "@/components/insights/InsightsList";
import InsightsEmptyState from "@/components/insights/InsightsEmptyState";
import InsightsLoadingState from "@/components/insights/InsightsLoadingState";
import { InsightData } from "@/components/insights/InsightCard";
import { useSubscription } from "@/contexts/SubscriptionContext";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import { synthToast } from "@/lib/synth-toast";
import type { InsightsResult } from "@/types/api";

// Filter labels for empty state messages
const filterLabels: Record<InsightFilter, string> = {
  all: "All",
  errors: "Error",
  suggestions: "Suggestion",
  performance: "Performance",
  reliability: "Reliability",
  recent: "Recent",
};

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<InsightFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/insights/basic");
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setError("Unexpected response from server. Please try again.");
          setIsLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data) {
            const insightsData: InsightsResult = data.data;
            
            // Map backend insights to UI format
            const mappedInsights: InsightData[] = [
              ...insightsData.automationsToOptimize.map((item) => ({
                id: item.id,
                title: item.title,
                summary: item.description.substring(0, 100),
                description: item.description,
                timestamp: "Recent",
                severity: item.severity === "error" ? "error" as const : item.severity === "warning" ? "warning" as const : "info" as const,
                isNew: true,
                category: "Workflow",
              })),
              ...insightsData.suggestedSkills.map((item) => ({
                id: item.id,
                title: item.title,
                summary: item.description.substring(0, 100),
                description: item.description,
                timestamp: "Recent",
                severity: "info" as const,
                isNew: true,
                category: "Suggestion",
              })),
              ...insightsData.performanceWarnings.map((item) => ({
                id: item.id,
                title: item.title,
                summary: item.description.substring(0, 100),
                description: item.description,
                timestamp: "Recent",
                severity: item.severity === "error" ? "error" as const : item.severity === "warning" ? "warning" as const : "info" as const,
                isNew: false,
                category: "Performance",
              })),
            ];
            
            setInsights(mappedInsights);
            setIsLocked(false);
          }
        } else if (response.status === 403) {
          setIsLocked(true);
          setInsights([]);
        } else {
          try {
            const errorData = await response.json();
            synthToast.error("Failed to load insights", errorData.error || "Unknown error");
          } catch {
            synthToast.error("Failed to load insights", `Server returned ${response.status}. Please try again.`);
          }
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
        synthToast.error("Error", "Failed to load insights");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  // Simple filter display logic
  const displayedInsights = insights;

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Subscription Banner */}
        {!isSubscribed && (
          <PageItem>
            <SubscriptionBanner feature="access insights" />
          </PageItem>
        )}

        {/* Locked State */}
        {isLocked && (
          <PageItem>
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Insights Unavailable
              </h3>
              <p className="text-muted-foreground mb-6 font-light max-w-md mx-auto">
                Upgrade to STARTER or higher to access insights and recommendations.
              </p>
            </div>
          </PageItem>
        )}

        {/* Page Header */}
        {!isLocked && (
          <PageItem>
            <h1 className="text-3xl font-display text-foreground mb-2">
              Synth Insights
            </h1>
            <p className="text-muted-foreground font-light">
              A complete view of your workflow recommendations and alerts.
            </p>
          </PageItem>
        )}

        {/* Main Content - Sidebar + List */}
        {!isLocked && (
          <PageItem>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Sidebar */}
            <div>
              <InsightFilterSidebar 
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter} 
              />
            </div>

            {/* Insights List */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden">
                {/* List Header */}
                <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">
                    {filterLabels[activeFilter]} Insights
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {displayedInsights.length} {displayedInsights.length === 1 ? "insight" : "insights"}
                  </span>
                </div>

                {/* Content Area */}
                <div className="p-4">
                  {isLoading ? (
                    <InsightsLoadingState />
                  ) : displayedInsights.length === 0 ? (
                    <InsightsEmptyState 
                      type={activeFilter === "all" ? "general" : "filtered"} 
                      filterName={filterLabels[activeFilter]}
                    />
                  ) : (
                    <InsightsList insights={displayedInsights} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageItem>
        )}
      </PageTransition>
    </AppShell>
  );
}
