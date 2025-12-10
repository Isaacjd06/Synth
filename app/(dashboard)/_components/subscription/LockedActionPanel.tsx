"use client";

import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LockedActionPanelProps {
  title?: string;
  message?: string;
  onUpgradeClick?: () => void;
}

export default function LockedActionPanel({
  title = "Actions Locked",
  message = "This action requires an active subscription. Subscribe to run, edit, and manage workflows.",
  onUpgradeClick,
}: LockedActionPanelProps) {
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.location.href = "/app/billing";
    }
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button onClick={handleUpgrade} size="sm" className="bg-primary hover:bg-primary/90 gap-2">
              Subscribe to Unlock
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

