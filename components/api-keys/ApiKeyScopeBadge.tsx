import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ApiKeyScope = "full" | "read" | "custom";

interface ApiKeyScopeBadgeProps {
  scope: ApiKeyScope;
  className?: string;
}

const scopeConfig = {
  full: {
    label: "Full Access",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  read: {
    label: "Read Only",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  custom: {
    label: "Custom",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
};

const ApiKeyScopeBadge = ({ scope, className }: ApiKeyScopeBadgeProps) => {
  const config = scopeConfig[scope];

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

export default ApiKeyScopeBadge;



