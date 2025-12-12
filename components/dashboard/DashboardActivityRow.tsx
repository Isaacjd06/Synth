"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ExecutionStatus = "success" | "running" | "error";

interface DashboardActivityRowProps {
  workflow: string;
  status: ExecutionStatus;
  duration: string;
  timestamp: string;
  workflowId?: string;
}

const statusStyles: Record<ExecutionStatus, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_hsl(142_70%_45%/0.2)]",
  running: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
  error: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_hsl(0_65%_50%/0.2)]",
};

const DashboardActivityRow = ({ workflow, status, duration, timestamp, workflowId }: DashboardActivityRowProps) => {
  return (
    <div className="flex items-center justify-between py-4 px-5 hover:bg-muted/30 transition-colors synth-row">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
          {workflow}
        </span>
        <Badge className={`${statusStyles[status]} text-xs px-2.5 py-0.5 capitalize`}>
          {status}
        </Badge>
      </div>
      
      <div className="flex items-center gap-5 shrink-0">
        <span className="text-xs text-muted-foreground font-mono hidden md:block w-12 text-right">
          {duration}
        </span>
        <span className="text-xs text-muted-foreground font-light w-24 text-right hidden sm:block">
          {timestamp}
        </span>
        {workflowId ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-primary" asChild>
            <Link href={`/app/workflows/${workflowId}`}>
              View Details
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-primary">
            View Details
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardActivityRow;

