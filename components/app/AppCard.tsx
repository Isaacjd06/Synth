"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppCardProps {
  children: ReactNode;
  className?: string;
}

const AppCard = ({ children, className }: AppCardProps) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-6 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
};

export default AppCard;

