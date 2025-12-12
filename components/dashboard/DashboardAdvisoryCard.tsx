"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, AlertCircle, Zap, BarChart3, ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardInsightItem from "./DashboardInsightItem";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { InsightsResult } from "@/types/api";

interface DashboardAdvisoryCardProps {
  isEmpty?: boolean;
}

const DashboardAdvisoryCard = ({ isEmpty = false }: DashboardAdvisoryCardProps) => {
  const { isSubscribed } = useSubscription();
  const [insights, setInsights] = useState<Array<{
    icon: typeof AlertCircle;
    title: string;
    description: string;
    isNew: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/insights/basic");
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data) {
            const insightsData: InsightsResult = data.data;
            
            // Map to dashboard format (top 3 most important)
            const allInsights = [
              ...insightsData.automationsToOptimize.slice(0, 2).map((item) => ({
                icon: AlertCircle,
                title: item.title,
                description: item.description.substring(0, 120),
                isNew: true,
              })),
              ...insightsData.performanceWarnings.slice(0, 1).map((item) => ({
                icon: Zap,
                title: item.title,
                description: item.description.substring(0, 120),
                isNew: false,
              })),
              ...insightsData.suggestedSkills.slice(0, 1).map((item) => ({
                icon: TrendingUp,
                title: item.title,
                description: item.description.substring(0, 120),
                isNew: true,
              })),
            ];
            
            setInsights(allInsights.slice(0, 4));
            setIsLocked(false);
          }
        } else if (response.status === 403) {
          setIsLocked(true);
          setInsights([]);
        } else {
          setInsights([]);
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    if (!isEmpty) {
      fetchInsights();
    } else {
      setLoading(false);
    }
  }, [isEmpty]);

  // Hidden empty state - will be shown when isEmpty is true (wired by backend later)
  if (isEmpty) {
    return (
      <Card className="hidden relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
        <CardContent className="py-12 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-light">No insights available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Locked state for FREE users
  if (isLocked || (!isSubscribed && insights.length === 0)) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
        <CardHeader className="border-b border-border/30 bg-muted/10 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2.5">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
            Synth Advisory
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-light mb-4">
            Upgrade to STARTER or higher to access insights and recommendations.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/billing">Upgrade Plan</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
        <CardHeader className="border-b border-border/30 bg-muted/10 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2.5">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
            Synth Advisory
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
        <CardHeader className="border-b border-border/30 bg-muted/10 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2.5">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
            Synth Advisory
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-light">No insights available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-b from-card to-synth-navy-light">
      {/* Decorative glow */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Synth Advisory
            </CardTitle>
            <p className="text-sm text-muted-foreground font-light mt-0.5">
              Synth is observing your workflows and providing insights.
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 pb-6 relative space-y-3">
        {insights.map((insight, index) => (
          <DashboardInsightItem
            key={index}
            icon={insight.icon}
            title={insight.title}
            description={insight.description}
            isNew={insight.isNew}
          />
        ))}
        
        <div className="pt-3">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary px-0" asChild>
            <Link href="/app/insights">
              View All Insights
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardAdvisoryCard;

