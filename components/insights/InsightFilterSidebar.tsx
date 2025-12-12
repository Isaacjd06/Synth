"use client";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  AlertCircle, 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Clock 
} from "lucide-react";

export type InsightFilter = "all" | "errors" | "suggestions" | "performance" | "reliability" | "recent";

interface InsightFilterSidebarProps {
  activeFilter: InsightFilter;
  onFilterChange: (filter: InsightFilter) => void;
}

const filters: { id: InsightFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "errors", label: "Errors", icon: AlertCircle },
  { id: "suggestions", label: "Suggestions", icon: Lightbulb },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "reliability", label: "Reliability", icon: Shield },
  { id: "recent", label: "Recent", icon: Clock },
];

const InsightFilterSidebar = ({ activeFilter, onFilterChange }: InsightFilterSidebarProps) => {
  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="lg:sticky lg:top-6">
        <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Filter Insights
          </h3>
          <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap",
                    "hover:bg-muted/60 border border-transparent",
                    isActive 
                      ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_15px_-5px_hsl(217_100%_60%/0.3)]" 
                      : "text-muted-foreground hover:text-foreground hover:border-border/60"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_6px_hsl(217_100%_60%/0.5)]"
                  )} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default InsightFilterSidebar;

