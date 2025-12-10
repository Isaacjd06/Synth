"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LogRetentionWarningProps {
  retentionDays: number;
  planName?: string;
}

export default function LogRetentionWarning({
  retentionDays,
  planName = "your plan",
}: LogRetentionWarningProps) {
  if (retentionDays === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-500/30 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-400" />
      <AlertTitle className="text-amber-400">Log Retention</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Execution logs are retained for {retentionDays} day{retentionDays !== 1 ? "s" : ""} on {planName}.
        {retentionDays < 90 && " Upgrade to extend retention."}
      </AlertDescription>
    </Alert>
  );
}

