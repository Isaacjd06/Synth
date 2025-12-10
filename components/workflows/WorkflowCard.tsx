"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import WorkflowStatusBadge, { WorkflowStatus } from "./WorkflowStatusBadge";
import WorkflowTriggerIcon, { TriggerType } from "./WorkflowTriggerIcon";
import { cn } from "@/lib/utils";

export interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: TriggerType;
  lastRunStatus?: "success" | "error" | "never";
  lastRunTime?: string;
  executionCount?: number;
  onView?: () => void;
  onRun?: () => void;
}

const WorkflowCard = ({
  id,
  name,
  description,
  status,
  trigger,
  lastRunStatus = "never",
  lastRunTime,
  executionCount = 0,
  onView,
  onRun,
}: WorkflowCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-card border-border/50 p-4 h-full hover:border-primary/40 transition-all duration-200 group">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <WorkflowTriggerIcon trigger={trigger} />
            <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
          </div>
          <WorkflowStatusBadge status={status} />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[32px]">
          {description}
        </p>

        {/* Execution Summary */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            {lastRunStatus === "success" && (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            )}
            {lastRunStatus === "error" && (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            {lastRunStatus === "never" && (
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className={cn(
              lastRunStatus === "success" && "text-green-400",
              lastRunStatus === "error" && "text-red-400",
              lastRunStatus === "never" && "text-muted-foreground"
            )}>
              {lastRunStatus === "never" 
                ? "Never ran" 
                : `Last run: ${lastRunStatus === "success" ? "Success" : "Error"}`}
            </span>
          </div>
          {lastRunTime && lastRunStatus !== "never" && (
            <span className="text-muted-foreground/60">{lastRunTime}</span>
          )}
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/30">
          <div className="text-xs">
            <span className="text-muted-foreground">Executions: </span>
            <span className="text-foreground font-medium">{executionCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onView}
            asChild
          >
            <Link href={`/app/workflows/${id}`}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              View
            </Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs"
            onClick={onRun}
            disabled={status === "error" || status === "draft"}
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default WorkflowCard;



