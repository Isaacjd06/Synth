import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "active" | "inactive" | "success" | "error";
  className?: string;
}

export default function Badge({ children, variant = "inactive", className }: BadgeProps) {
  const variantStyles = {
    active: "bg-green-900/30 text-green-400 border-green-700",
    inactive: "bg-gray-800 text-gray-400 border-gray-700",
    success: "bg-green-900/30 text-green-400 border-green-700",
    error: "bg-red-900/30 text-red-400 border-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

