"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface AdvisoryInsight {
  id: string;
  sourceType: string;
  title: string;
  body: string;
  priority: "low" | "medium" | "high";
  category: string;
  createdAt: string;
}

export default function SynthAdvisory() {
  const [insights, setInsights] = useState<AdvisoryInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdvisory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/advisory", {
          cache: "no-store",
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response received:", text.substring(0, 200));
          // If it's not JSON, just show empty insights instead of error
          setInsights([]);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
          }));
          // For advisory, if there's an error, just show empty insights
          setInsights([]);
          return;
        }

        const data = await response.json();

        if (data.ok && Array.isArray(data.insights)) {
          setInsights(data.insights);
        } else {
          setInsights([]);
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Error fetching advisory insights:", error);
        // For advisory, silently fail and show empty state
        setInsights([]);
        setError(null); // Don't show error for advisory
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisory();
  }, []);

  const getPriorityVariant = (
    priority: string
  ): "success" | "active" | "error" => {
    if (priority === "high") return "error";
    if (priority === "medium") return "active";
    return "success";
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      efficiency: "text-blue-400",
      optimization: "text-purple-400",
      reliability: "text-red-400",
      growth: "text-green-400",
      default: "text-gray-400",
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Synth Advisory</h2>
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-800 rounded animate-pulse w-4/6" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-800 bg-red-900/10">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Synth Advisory</h2>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[#194c92] hover:text-[#1a5ba8] transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Synth Advisory
          </h2>
          <p className="text-sm text-gray-400">
            AI-powered insights and recommendations for your automations
          </p>
        </div>

        {/* Insights List */}
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              No advisory insights available at this time.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Insights will appear as Synth analyzes your workflows and usage
              patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-lg border border-gray-800 bg-gray-900/30 hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-medium text-white flex-1">
                    {insight.title}
                  </h3>
                  <Badge
                    variant={getPriorityVariant(insight.priority)}
                    className="flex-shrink-0"
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {insight.body}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`text-xs ${getCategoryColor(insight.category)}`}
                  >
                    {insight.category}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

