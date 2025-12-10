import { Check, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ConnectionStatus = "connected" | "disconnected" | "expired";

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

const statusConfig = {
  connected: {
    label: "Connected",
    icon: Check,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  disconnected: {
    label: "Not Connected",
    icon: X,
    className: "bg-muted text-muted-foreground border-border",
  },
  expired: {
    label: "Needs Reconnect",
    icon: AlertTriangle,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const ConnectionStatusBadge = ({ status, className }: ConnectionStatusBadgeProps) => {
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

export default ConnectionStatusBadge;



