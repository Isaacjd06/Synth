"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap
} from "lucide-react";
import ExecutionStatusBadge, { ExecutionStatus } from "./ExecutionStatusBadge";
import WorkflowTriggerIcon, { TriggerType } from "@/components/workflows/WorkflowTriggerIcon";

interface ExecutionStep {
  id: string;
  name: string;
  status: "success" | "error" | "skipped";
  output: string;
}

interface ExecutionDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  execution: {
    id: string;
    executionId: string;
    workflowName: string;
    status: ExecutionStatus;
    trigger: TriggerType;
    startTime: string;
    endTime: string;
    duration: string;
    triggerSource: string;
    steps: ExecutionStep[];
    inputData: Record<string, unknown>;
    outputData: Record<string, unknown>;
    errorMessage?: string;
    errorStack?: string;
  } | null;
}

const ExecutionDetailsDrawer = ({ open, onClose, execution }: ExecutionDetailsDrawerProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["steps"]);

  if (!execution) return null;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-background border-border p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground">
                Execution Details
              </SheetTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ID: {execution.executionId}
              </p>
            </div>
            <ExecutionStatusBadge status={execution.status} />
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Overview */}
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Overview
              </h4>
              
              <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Workflow</span>
                  <span className="text-sm font-medium text-foreground">{execution.workflowName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trigger</span>
                  <div className="flex items-center gap-2">
                    <WorkflowTriggerIcon trigger={execution.trigger} />
                    <span className="text-sm text-foreground">{execution.triggerSource}</span>
                  </div>
                </div>
                <Separator className="bg-border/30" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Started
                    </p>
                    <p className="text-xs text-foreground">{execution.startTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Finished
                    </p>
                    <p className="text-xs text-foreground">{execution.endTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duration
                    </p>
                    <p className="text-xs text-foreground font-medium">{execution.duration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div>
              <button
                onClick={() => toggleSection("steps")}
                className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Steps ({execution.steps.length})
                </span>
                {isSectionExpanded("steps") ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              <AnimatePresence>
                {isSectionExpanded("steps") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2"
                  >
                    {execution.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border/30"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {step.status === "success" ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : step.status === "error" ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                            <span className="text-sm text-foreground font-medium">{step.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.output}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator className="bg-border/50" />

            {/* Input Data */}
            <div>
              <button
                onClick={() => toggleSection("input")}
                className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3"
              >
                Input Data
                {isSectionExpanded("input") ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              <AnimatePresence>
                {isSectionExpanded("input") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <pre className="p-3 rounded-lg bg-muted/20 border border-border/30 text-xs font-mono text-foreground/80 overflow-x-auto">
                      {JSON.stringify(execution.inputData, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Output Data */}
            <div>
              <button
                onClick={() => toggleSection("output")}
                className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3"
              >
                Output Data
                {isSectionExpanded("output") ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              <AnimatePresence>
                {isSectionExpanded("output") && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <pre className="p-3 rounded-lg bg-muted/20 border border-border/30 text-xs font-mono text-foreground/80 overflow-x-auto">
                      {JSON.stringify(execution.outputData, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error Details */}
            {execution.status === "error" && execution.errorMessage && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h4 className="text-sm font-medium text-red-400">Error Details</h4>
                </div>
                <p className="text-sm text-red-400/90 mb-3">{execution.errorMessage}</p>
                {execution.errorStack && (
                  <pre className="p-2 rounded bg-red-500/10 text-xs font-mono text-red-400/70 overflow-x-auto">
                    {execution.errorStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ExecutionDetailsDrawer;




