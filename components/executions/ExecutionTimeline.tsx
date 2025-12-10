import { Zap, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "error" | "running" | "pending";
  duration?: string;
}

interface ExecutionTimelineProps {
  steps: TimelineStep[];
}

const ExecutionTimeline = ({ steps }: ExecutionTimelineProps) => {
  const getStepIcon = (status: TimelineStep["status"], isFirst: boolean) => {
    if (isFirst) {
      return <Zap className="w-4 h-4" />;
    }
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-current" />;
    }
  };

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "text-emerald-400 border-emerald-400/50 bg-emerald-400/10";
      case "error":
        return "text-destructive border-destructive/50 bg-destructive/10";
      case "running":
        return "text-primary border-primary/50 bg-primary/10";
      default:
        return "text-muted-foreground border-border bg-muted/30";
    }
  };

  const getLineColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-400/50";
      case "error":
        return "bg-destructive/50";
      case "running":
        return "bg-primary/50";
      default:
        return "bg-border";
    }
  };

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Connecting Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]",
                getLineColor(step.status)
              )}
            />
          )}

          {/* Step */}
          <div className="flex items-start gap-4 py-3">
            {/* Icon */}
            <div
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                getStatusColor(step.status)
              )}
            >
              {getStepIcon(step.status, index === 0)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {index === 0 ? "Trigger" : `Step ${index}`}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                  )}
                </div>
                {step.duration && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {step.duration}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground mt-0.5">{step.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExecutionTimeline;


