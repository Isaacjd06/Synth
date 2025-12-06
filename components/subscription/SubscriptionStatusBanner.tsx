"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface SubscriptionStatusBannerProps {
  subscriptionStatus: string | null | undefined;
  trialEndsAt: Date | string | null | undefined;
}

export default function SubscriptionStatusBanner({
  subscriptionStatus,
  trialEndsAt,
}: SubscriptionStatusBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (subscriptionStatus === "trialing" && trialEndsAt) {
      const updateCountdown = () => {
        const now = new Date();
        const trialEnd = new Date(trialEndsAt);
        const diff = trialEnd.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining("Trial expired");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeRemaining(`${days} day${days !== 1 ? "s" : ""} remaining`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours} hour${hours !== 1 ? "s" : ""} remaining`);
        } else {
          setTimeRemaining(`${minutes} minute${minutes !== 1 ? "s" : ""} remaining`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [subscriptionStatus, trialEndsAt]);

  if (subscriptionStatus === "active") {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <Badge variant="success">Subscription Active</Badge>
      </div>
    );
  }

  if (subscriptionStatus === "trialing") {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <div className="flex items-center gap-2">
          <Badge variant="active" className="bg-yellow-900/30 text-yellow-400 border-yellow-700">
            Trial Active
          </Badge>
          {timeRemaining && (
            <span className="text-sm text-yellow-300">{timeRemaining}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
      <XCircle className="w-5 h-5 text-red-400" />
      <Badge variant="error">Subscription Required</Badge>
    </div>
  );
}

