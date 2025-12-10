"use client";

import { Badge } from "@/components/ui/badge";
import type { SubscriptionPlan } from "@/lib/subscription";
import { getPlanDisplayName, getPlanBadgeColors } from "@/lib/subscription";

interface SubscriptionPillProps {
  plan: SubscriptionPlan;
  isSubscribed: boolean;
}

export default function SubscriptionPill({ plan, isSubscribed }: SubscriptionPillProps) {
  const colors = getPlanBadgeColors(plan);
  const displayName = getPlanDisplayName(plan);

  return (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${colors.border} border font-medium`}
    >
      {displayName}
    </Badge>
  );
}

