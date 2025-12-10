import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ApiKeyStatus = "active" | "revoked";

interface ApiKeyStatusBadgeProps {
  status: ApiKeyStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    icon: Check,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  revoked: {
    label: "Revoked",
    icon: X,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const ApiKeyStatusBadge = ({ status, className }: ApiKeyStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium flex items-center gap-1",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export default ApiKeyStatusBadge;



