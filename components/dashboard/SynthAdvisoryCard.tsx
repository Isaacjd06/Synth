"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface Insight {
  id: string;
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
  category: "efficiency" | "optimization" | "reliability" | "growth";
  createdAt: string;
}

interface AdvisoryData {
  ok: boolean;
  insights: Insight[];
}

const SynthAdvisoryCard = () => {
  const [data, setData] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/advisory");
        const result = await response.json();
        if (result.ok) {
          setData(result);
        }
      } catch {
        // Use empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPriorityVariant = (priority: string): "destructive" | "secondary" | "default" => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "default";
      default: return "secondary";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "efficiency": return "text-blue-400";
      case "optimization": return "text-purple-400";
      case "reliability": return "text-red-400";
      case "growth": return "text-green-400";
      default: return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border/50 p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-7 w-36 mb-2 bg-muted" />
            <Skeleton className="h-4 w-64 bg-muted" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const insights = data?.insights || [];

  return (
    <Card className="bg-card border-border/50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Synth Advisory</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered insights and recommendations for your automations
          </p>
        </div>

        {/* Insights List */}
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-lg bg-muted/10 border border-border/50 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm text-foreground">{insight.title}</h4>
                  <Badge variant={getPriorityVariant(insight.priority)} className="text-xs capitalize">
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                  {insight.body}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs capitalize ${getCategoryColor(insight.category)}`}>
                    {insight.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(insight.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-foreground">No advisory insights available at this time.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Insights will appear as Synth analyzes your workflows and usage patterns.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SynthAdvisoryCard;



