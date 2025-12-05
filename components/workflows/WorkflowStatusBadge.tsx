import Badge from "@/components/ui/Badge";
import { formatStatus } from "@/lib/utils";

interface WorkflowStatusBadgeProps {
  active: boolean;
  className?: string;
}

export default function WorkflowStatusBadge({
  active,
  className,
}: WorkflowStatusBadgeProps) {
  return (
    <Badge variant={active ? "active" : "inactive"} className={className}>
      {formatStatus(active ? "active" : "inactive")}
    </Badge>
  );
}

