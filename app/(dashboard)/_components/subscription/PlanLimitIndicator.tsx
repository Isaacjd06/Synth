"use client";

import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

interface PlanLimitIndicatorProps {
  label: string;
  used: number;
  limit: number | null; // null means unlimited
  showWarning?: boolean;
}

export default function PlanLimitIndicator({
  label,
  used,
  limit,
  showWarning = true,
}: PlanLimitIndicatorProps) {
  if (limit === null) {
    // Unlimited
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground font-medium">
            {used.toLocaleString()} / Unlimited
          </span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isAtLimit && showWarning && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          <span
            className={`font-medium ${
              isAtLimit
                ? "text-destructive"
                : isNearLimit
                ? "text-amber-400"
                : "text-foreground"
            }`}
          >
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${
          isAtLimit
            ? "[&>div]:bg-destructive"
            : isNearLimit
            ? "[&>div]:bg-amber-400"
            : ""
        }`}
      />
      {isNearLimit && showWarning && (
        <p className="text-xs text-amber-400">
          {isAtLimit
            ? "Limit reached. Upgrade to continue."
            : "Approaching limit. Consider upgrading."}
        </p>
      )}
    </div>
  );
}

