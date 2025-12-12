"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type InsightSeverity = "error" | "warning" | "info";

export interface InsightData {
  id: string;
  title: string;
  summary: string;
  description: string;
  timestamp: string;
  severity: InsightSeverity;
  isNew?: boolean;
  category: string;
}

interface InsightCardProps {
  insight: InsightData;
}

const severityStyles: Record<InsightSeverity, { badge: string; border: string; glow: string }> = {
  error: {
    badge: "bg-destructive/20 text-red-400 border-destructive/40",
    border: "border-destructive/30",
    glow: "shadow-[0_0_20px_-5px_hsl(0_70%_50%/0.2)]",
  },
  warning: {
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_20px_-5px_hsl(45_90%_50%/0.2)]",
  },
  info: {
    badge: "bg-primary/20 text-primary border-primary/40",
    border: "border-primary/30",
    glow: "shadow-[0_0_20px_-5px_hsl(217_91%_60%/0.2)]",
  },
};

const InsightCard = ({ insight }: InsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = severityStyles[insight.severity];

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border bg-card/80 backdrop-blur-md transition-all duration-300 overflow-hidden",
        styles.border,
        isExpanded && styles.glow
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn("text-[10px] uppercase tracking-wider font-medium", styles.badge)}
              >
                {insight.severity}
              </Badge>
              <Badge 
                variant="outline" 
                className="text-[10px] uppercase tracking-wider font-medium bg-muted/50 text-muted-foreground border-border/50"
              >
                {insight.category}
              </Badge>
              {insight.isNew && (
                <Badge className="bg-primary/25 text-primary border-primary/40 text-[10px] px-1.5 py-0">
                  New
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
              {insight.title}
            </h3>
            <p className="text-xs text-muted-foreground font-light line-clamp-1">
              {insight.summary}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground/70">
              {insight.timestamp}
            </span>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-300",
                isExpanded && "rotate-180"
              )} 
            />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border/30">
              <div className="pt-4">
                <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
                  {insight.description}
                </p>
                <div className="flex items-center gap-3">
                  <Button size="sm" className="h-8 text-xs">
                    Resolve Issue
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
                    <Link href="/app/workflows">
                      <ExternalLink className="w-3 h-3" />
                      View Workflow
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InsightCard;

