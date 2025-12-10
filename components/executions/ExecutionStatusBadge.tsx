import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ExecutionStatus = "success" | "error" | "running" | "pending";

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  className?: string;
}

const statusConfig: Record<ExecutionStatus, { label: string; className: string }> = {
  success: {
    label: "Success",
    className: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  error: {
    label: "Error",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  running: {
    label: "Running",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
};

const ExecutionStatusBadge = ({ status, className }: ExecutionStatusBadgeProps) => {
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

export default ExecutionStatusBadge;



