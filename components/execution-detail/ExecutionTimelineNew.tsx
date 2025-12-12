"use client";
import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, XCircle, MinusCircle, Clock, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Lazy load the JSON viewer
const LazyJsonViewer = lazy(() => import("./StepJsonViewer"));

interface TimelineStep {
  id: string;
  name: string;
  status: "completed" | "error" | "skipped" | "running";
  timestamp: string;
  duration: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorDetails?: {
    message: string;
    cause?: string;
  };
}

interface ExecutionTimelineNewProps {
  steps: TimelineStep[];
  isSubscribed?: boolean;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Success",
    color: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    glow: "",
  },
  error: {
    icon: XCircle,
    label: "Error",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    glow: "shadow-[0_0_25px_-5px_hsl(0_70%_50%/0.4)]",
  },
  skipped: {
    icon: MinusCircle,
    label: "Skipped",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border/50",
    glow: "",
  },
  running: {
    icon: Clock,
    label: "Running",
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    glow: "",
  },
};

const JsonViewerFallback = () => (
  <div className="p-4 space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

const ExecutionTimelineNew = ({ steps, isSubscribed = true }: ExecutionTimelineNewProps) => {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const errorStepRef = useRef<HTMLDivElement>(null);

  // Find first error step and auto-expand it
  useEffect(() => {
    const errorStep = steps.find((step) => step.status === "error");
    if (errorStep) {
      setExpandedSteps([errorStep.id]);
      // Scroll to error step after a short delay
      setTimeout(() => {
        errorStepRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Execution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line with gradient */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/30 to-border/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent blur-sm" />
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const config = statusConfig[step.status];
              const Icon = config.icon;
              const isExpanded = expandedSteps.includes(step.id);
              const isError = step.status === "error";

              return (
                <div 
                  key={step.id} 
                  className="relative"
                  ref={isError ? errorStepRef : undefined}
                >
                  {/* Step Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "ml-10 rounded-xl border transition-all duration-300",
                      "bg-muted/20 hover:bg-muted/30",
                      isExpanded ? config.border : "border-border/30 hover:border-border/50",
                      isError && config.glow
                    )}
                  >
                    {/* Header Row */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full p-4 text-left flex items-center gap-4 group"
                    >
                      {/* Step Icon (positioned on the timeline) */}
                      <div
                        className={cn(
                          "absolute left-0 w-10 h-10 rounded-lg flex items-center justify-center",
                          "border-2 z-10 transition-all duration-300 group-hover:scale-105",
                          config.bg,
                          config.border
                        )}
                      >
                        <Icon className={cn(
                          "w-5 h-5",
                          config.color,
                          step.status === "running" && "animate-spin"
                        )} />
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", config.bg, config.color, config.border)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {step.name}
                        </h4>
                      </div>

                      {/* Meta Info */}
                      <div className="hidden sm:flex items-center gap-4 shrink-0">
                        <span className="text-xs text-muted-foreground">{step.timestamp}</span>
                        <span className="text-xs font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded">
                          {step.duration}
                        </span>
                      </div>

                      {/* Expand Icon */}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
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
                          <div className="px-4 pb-4 pt-0 border-t border-border/30 space-y-4">
                            <div className="pt-4 space-y-4">
                              {/* Input Data */}
                              {step.inputData && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  <Suspense fallback={<JsonViewerFallback />}>
                                    <LazyJsonViewer 
                                      title="Input Data" 
                                      data={step.inputData}
                                      isSubscribed={isSubscribed}
                                    />
                                  </Suspense>
                                </motion.div>
                              )}

                              {/* Output Data */}
                              {step.outputData && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  <Suspense fallback={<JsonViewerFallback />}>
                                    <LazyJsonViewer 
                                      title="Output Data" 
                                      data={step.outputData}
                                      isSubscribed={isSubscribed}
                                    />
                                  </Suspense>
                                </motion.div>
                              )}

                              {/* Error Details */}
                              {step.errorDetails && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3 }}
                                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                                >
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                    Error Details
                                  </p>
                                  <p className="text-sm text-red-400 font-medium mb-2">
                                    {step.errorDetails.message}
                                  </p>
                                  {step.errorDetails.cause && (
                                    <p className="text-xs text-muted-foreground">
                                      Possible cause: {step.errorDetails.cause}
                                    </p>
                                  )}
                                </motion.div>
                              )}

                              {/* Edit Lock for unsubscribed */}
                              {!isSubscribed && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                                      <Lock className="w-3 h-3" />
                                      <span>Editing requires an active subscription</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This feature requires an active Synth plan.</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionTimelineNew;
