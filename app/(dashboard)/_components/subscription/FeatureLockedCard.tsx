"use client";

import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionPlan } from "@/lib/subscription";
import { getPlanDisplayName } from "@/lib/subscription";

interface FeatureLockedCardProps {
  featureName: string;
  requiredPlan: SubscriptionPlan;
  description?: string;
  onUpgradeClick?: () => void;
}

export default function FeatureLockedCard({
  featureName,
  requiredPlan,
  description,
  onUpgradeClick,
}: FeatureLockedCardProps) {
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.location.href = "/app/billing";
    }
  };

  const planDisplayName = getPlanDisplayName(requiredPlan);

  return (
    <Card className="border-border/50 opacity-75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-5 h-5" />
          {featureName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Available on {planDisplayName} plan and above.
          </p>
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 gap-2"
          >
            Upgrade to {planDisplayName}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

