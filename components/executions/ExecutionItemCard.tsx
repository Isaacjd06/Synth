"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Calendar, AlertCircle } from "lucide-react";
import ExecutionStatusBadge, { ExecutionStatus } from "./ExecutionStatusBadge";
import WorkflowTriggerIcon, { TriggerType } from "@/components/workflows/WorkflowTriggerIcon";

export interface ExecutionItemCardProps {
  id: string;
  executionId: string;
  workflowName: string;
  workflowId?: string;
  status: ExecutionStatus;
  trigger: TriggerType;
  startTime: string;
  endTime: string;
  duration: string;
  executionTimeMs?: number;
  summary: string;
  errorMessage?: string;
  onViewDetails: () => void;
}

const ExecutionItemCard = ({
  executionId,
  workflowName,
  status,
  trigger,
  startTime,
  endTime,
  duration,
  summary,
  errorMessage,
  onViewDetails,
}: ExecutionItemCardProps) => {
  // Shorten execution ID for display (e.g., exec_ab12cd3)
  const shortId = executionId.length > 14 ? `${executionId.slice(0, 12)}...` : executionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-card border-border/50 p-4 hover:border-primary/30 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <ExecutionStatusBadge status={status} />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{workflowName}</h3>
              <p className="text-[10px] text-muted-foreground font-mono">{shortId}</p>
            </div>
          </div>
          <WorkflowTriggerIcon trigger={trigger} showLabel />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Started</p>
              <p className="text-xs text-foreground truncate">{startTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Finished</p>
              <p className="text-xs text-foreground truncate">{endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Duration</p>
              <p className="text-xs text-foreground font-medium">{duration}</p>
            </div>
          </div>
        </div>

        {/* Summary or Error */}
        {status === "error" && errorMessage ? (
          <div className="flex items-start gap-1.5 mb-3 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 line-clamp-2">{errorMessage}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{summary}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="h-7 text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View Details
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ExecutionItemCard;
