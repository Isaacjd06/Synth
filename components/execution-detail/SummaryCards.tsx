"use client";
import { CheckCircle2, Clock, Zap, GitBranch, XCircle, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  status: "success" | "error" | "running";
  executionTime: string;
  triggerType: string;
  workflowVersion: string;
}

const statusStyles = {
  success: { 
    label: "Success", 
    color: "text-green-400", 
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    glow: "shadow-[0_0_20px_-5px_hsl(142_70%_45%/0.3)]",
    icon: CheckCircle2,
  },
  error: { 
    label: "Failed", 
    color: "text-red-400", 
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "shadow-[0_0_20px_-5px_hsl(0_70%_50%/0.3)]",
    icon: XCircle,
  },
  running: { 
    label: "Running", 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_20px_-5px_hsl(45_90%_50%/0.3)]",
    icon: Loader2,
  },
};

const SummaryCards = ({ status, executionTime, triggerType, workflowVersion }: SummaryCardsProps) => {
  const statusStyle = statusStyles[status];
  const StatusIcon = statusStyle.icon;

  const cards = [
    {
      label: "Status",
      value: statusStyle.label,
      icon: StatusIcon,
      iconColor: statusStyle.color,
      bg: statusStyle.bg,
      border: statusStyle.border,
      glow: statusStyle.glow,
      tooltip: "The final status of this execution run.",
      animate: status === "running",
    },
    {
      label: "Execution Time",
      value: executionTime,
      icon: Clock,
      iconColor: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
      glow: "shadow-[0_0_20px_-5px_hsl(217_91%_60%/0.2)]",
      tooltip: "Total time taken to complete all steps.",
    },
    {
      label: "Trigger Type",
      value: triggerType,
      icon: Zap,
      iconColor: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      glow: "shadow-[0_0_20px_-5px_hsl(45_90%_50%/0.2)]",
      tooltip: "How this execution was initiated.",
    },
    {
      label: "Workflow Version",
      value: workflowVersion,
      icon: GitBranch,
      iconColor: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      glow: "shadow-[0_0_20px_-5px_hsl(180_70%_50%/0.2)]",
      tooltip: "The version of the workflow that was executed.",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Tooltip key={card.label}>
            <TooltipTrigger asChild>
              <Card className={cn(
                "border bg-card/60 hover:bg-card/80 transition-all duration-300 cursor-default group",
                card.border,
                card.glow
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105",
                      card.bg
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        card.iconColor,
                        card.animate && "animate-spin"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {card.label}
                        </p>
                        <Info className="w-3 h-3 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {card.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{card.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default SummaryCards;

