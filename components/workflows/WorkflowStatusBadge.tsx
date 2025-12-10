import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WorkflowStatus = "active" | "inactive" | "error" | "draft";

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

const statusConfig: Record<WorkflowStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted/30 text-muted-foreground border-border/50",
  },
  error: {
    label: "Error",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  draft: {
    label: "Draft",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
};

const WorkflowStatusBadge = ({ status, className }: WorkflowStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
};

export default WorkflowStatusBadge;



