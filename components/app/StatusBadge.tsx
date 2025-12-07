"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "inactive" | "success" | "error" | "warning";

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-green-900/30 text-green-400 border-green-700",
  inactive: "bg-muted text-muted-foreground border-border",
  success: "bg-green-900/30 text-green-400 border-green-700",
  error: "bg-red-900/30 text-red-400 border-red-700",
  warning: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
};

const StatusBadge = ({ variant, children }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
};

export default StatusBadge;

