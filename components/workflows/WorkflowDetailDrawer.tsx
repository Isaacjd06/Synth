import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight 
} from "lucide-react";
import WorkflowStatusBadge, { WorkflowStatus } from "./WorkflowStatusBadge";
import WorkflowTriggerIcon, { TriggerType } from "./WorkflowTriggerIcon";

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
}

interface ExecutionResult {
  id: string;
  status: "success" | "error";
  timestamp: string;
  duration: string;
}

interface WorkflowDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    description: string;
    status: WorkflowStatus;
    trigger: TriggerType;
    steps: WorkflowStep[];
    recentExecutions: ExecutionResult[];
  } | null;
}

const WorkflowDetailDrawer = ({ open, onClose, workflow }: WorkflowDetailDrawerProps) => {
  if (!workflow) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-background border-border p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <WorkflowTriggerIcon trigger={workflow.trigger} />
              <div>
                <SheetTitle className="text-lg font-semibold text-foreground">
                  {workflow.name}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trigger: {workflow.trigger}
                </p>
              </div>
            </div>
            <WorkflowStatusBadge status={workflow.status} />
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Description
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {workflow.description}
              </p>
            </div>

            <Separator className="bg-border/50" />

            {/* Workflow Steps */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Workflow Steps
              </h4>
              <div className="space-y-2">
                {workflow.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-sm text-foreground">{step.name}</p>
                      <p className="text-[10px] text-muted-foreground">{step.type}</p>
                    </div>
                    {idx < workflow.steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Recent Executions */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Recent Executions
              </h4>
              <div className="space-y-2">
                {workflow.recentExecutions.map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center gap-2">
                      {exec.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div>
                        <p className="text-xs text-foreground">
                          {exec.status === "success" ? "Completed" : "Failed"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{exec.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {exec.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Pencil className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
          <Button variant="default" size="sm" className="flex-1">
            <Play className="w-4 h-4 mr-1.5" />
            Run Now
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WorkflowDetailDrawer;



