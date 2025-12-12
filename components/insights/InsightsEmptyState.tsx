"use client";
import { Brain, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsEmptyStateProps {
  type: "general" | "filtered";
  filterName?: string;
}

const InsightsEmptyState = ({ type, filterName }: InsightsEmptyStateProps) => {
  const isFiltered = type === "filtered";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
        "bg-muted/50 border border-border/50"
      )}>
        {isFiltered ? (
          <Search className="w-7 h-7 text-muted-foreground" />
        ) : (
          <Brain className="w-7 h-7 text-primary/70" />
        )}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2 text-center">
        {isFiltered ? "No insights of this type yet" : "No insights available"}
      </h3>
      <p className="text-sm text-muted-foreground font-light text-center max-w-sm leading-relaxed">
        {isFiltered 
          ? `There are no ${filterName?.toLowerCase() || "matching"} insights to display at this time.`
          : "Synth is monitoring your workflows and will display insights here once available."
        }
      </p>
    </div>
  );
};

export default InsightsEmptyState;

