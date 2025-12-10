"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Zap,
  Copy,
  Check,
  Database,
  User,
  Server,
  FileJson
} from "lucide-react";
import ExecutionStatusBadge, { ExecutionStatus } from "./ExecutionStatusBadge";
import WorkflowTriggerIcon, { TriggerType } from "@/components/workflows/WorkflowTriggerIcon";

interface ExecutionStep {
  id: string;
  name: string;
  status: "success" | "error" | "skipped";
  output: string;
}

export interface ExecutionData {
  id: string;
  executionId: string;
  workflowId?: string;
  workflowName: string;
  status: ExecutionStatus;
  trigger: TriggerType;
  startTime: string;
  endTime: string;
  duration: string;
  executionTimeMs?: number;
  triggerSource: string;
  summary: string;
  steps: ExecutionStep[];
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  userId?: string;
  pipedreamExecutionId?: string;
  pipedreamStatus?: string;
  pipedreamTimestamps?: {
    created?: string;
    started?: string;
    finished?: string;
  };
  pipedreamError?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface ExecutionBottomPanelProps {
  open: boolean;
  onClose: () => void;
  execution: ExecutionData | null;
}

const JsonViewer = ({ data, label }: { data: Record<string, unknown>; label: string }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 mr-1 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 mr-1" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="p-4 pt-10 rounded-lg bg-muted/20 border border-border/30 text-xs font-mono text-foreground/80 overflow-x-auto max-h-[300px] overflow-y-auto">
        {jsonString}
      </pre>
    </div>
  );
};

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-muted/10 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const ExecutionBottomPanel = ({ open, onClose, execution }: ExecutionBottomPanelProps) => {
  if (!execution) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Bottom Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-xl shadow-2xl"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Execution Details
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    {execution.executionId}
                  </p>
                </div>
                <ExecutionStatusBadge status={execution.status} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="h-[calc(80vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Section 1: Overview */}
                <CollapsibleSection title="Overview" icon={Zap} defaultOpen={true}>
                  <div className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Execution ID</p>
                        <p className="text-sm font-mono text-foreground">{execution.executionId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Workflow</p>
                        <p className="text-sm text-foreground font-medium">{execution.workflowName}</p>
                      </div>
                      {execution.workflowId && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Workflow ID</p>
                          <p className="text-sm font-mono text-foreground">{execution.workflowId}</p>
                        </div>
                      )}
                      {execution.pipedreamExecutionId && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Pipedream ID</p>
                          <p className="text-sm font-mono text-foreground">{execution.pipedreamExecutionId}</p>
                        </div>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Started At</p>
                          <p className="text-sm text-foreground">{execution.startTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Finished At</p>
                          <p className="text-sm text-foreground">{execution.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                          <p className="text-sm text-foreground font-medium">{execution.duration}</p>
                        </div>
                      </div>
                      {execution.executionTimeMs && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Time (ms)</p>
                            <p className="text-sm text-foreground font-mono">{execution.executionTimeMs}ms</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <WorkflowTriggerIcon trigger={execution.trigger} />
                        <span className="text-sm text-foreground">{execution.triggerSource}</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 2: Execution Data */}
                <CollapsibleSection title="Execution Data" icon={FileJson} defaultOpen={execution.status === "error"}>
                  <div className="space-y-4">
                    {/* Input Data */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Input Data
                      </h4>
                      <JsonViewer data={execution.inputData} label="Input" />
                    </div>

                    {/* Output Data */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Output Data
                      </h4>
                      <JsonViewer data={execution.outputData} label="Output" />
                    </div>

                    {/* Error Message */}
                    {execution.errorMessage && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <h4 className="text-sm font-medium text-red-400">Error Message</h4>
                        </div>
                        <p className="text-sm text-red-400/90 mb-3">{execution.errorMessage}</p>
                        {execution.errorStack && (
                          <pre className="p-3 rounded bg-red-500/10 text-xs font-mono text-red-400/70 overflow-x-auto">
                            {execution.errorStack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Section 3: Steps */}
                {execution.steps.length > 0 && (
                  <CollapsibleSection title={`Steps (${execution.steps.length})`} icon={Zap}>
                    <div className="space-y-2">
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
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Step {idx + 1}
                              </Badge>
                              <span className="text-sm text-foreground font-medium">{step.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{step.output}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Section 4: Workflow Context */}
                <CollapsibleSection title="Workflow Context" icon={Database}>
                  <div className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-3">
                    {execution.userId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          Owner User ID
                        </span>
                        <span className="text-sm font-mono text-foreground">{execution.userId}</span>
                      </div>
                    )}
                    {execution.workflowId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Workflow ID</span>
                        <span className="text-sm font-mono text-foreground">{execution.workflowId}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actions Count</span>
                      <span className="text-sm text-foreground">{execution.steps.length} steps</span>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Section 5: Pipedream API Data */}
                {(execution.pipedreamExecutionId || execution.pipedreamStatus) && (
                  <CollapsibleSection title="Pipedream API Data" icon={Server}>
                    <div className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-3">
                      {execution.pipedreamExecutionId && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Execution ID</span>
                          <span className="text-sm font-mono text-foreground">{execution.pipedreamExecutionId}</span>
                        </div>
                      )}
                      {execution.pipedreamStatus && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant="outline">{execution.pipedreamStatus}</Badge>
                        </div>
                      )}
                      {execution.pipedreamTimestamps && (
                        <>
                          {execution.pipedreamTimestamps.created && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Created</span>
                              <span className="text-sm text-foreground">{execution.pipedreamTimestamps.created}</span>
                            </div>
                          )}
                          {execution.pipedreamTimestamps.started && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Started</span>
                              <span className="text-sm text-foreground">{execution.pipedreamTimestamps.started}</span>
                            </div>
                          )}
                          {execution.pipedreamTimestamps.finished && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Finished</span>
                              <span className="text-sm text-foreground">{execution.pipedreamTimestamps.finished}</span>
                            </div>
                          )}
                        </>
                      )}
                      {execution.pipedreamError && Object.keys(execution.pipedreamError).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Error Object</p>
                          <JsonViewer data={execution.pipedreamError} label="Pipedream Error" />
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Section 6: Internal Metadata */}
                {(execution.createdAt || execution.updatedAt) && (
                  <CollapsibleSection title="Internal Metadata" icon={Database}>
                    <div className="p-4 rounded-lg bg-muted/10 border border-border/30 space-y-3">
                      {execution.createdAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Created At</span>
                          <span className="text-sm text-foreground">{execution.createdAt}</span>
                        </div>
                      )}
                      {execution.updatedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Updated At</span>
                          <span className="text-sm text-foreground">{execution.updatedAt}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Internal ID</span>
                        <span className="text-sm font-mono text-foreground">{execution.id}</span>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExecutionBottomPanel;



