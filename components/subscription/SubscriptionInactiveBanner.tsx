"use client";

import { useSubscription } from "@/lib/useSubscription";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Banner component that shows when subscription is inactive
 * Shows for: past_due, canceled, or no subscription
 * Hidden for: active, trialing subscriptions
 */
export default function SubscriptionInactiveBanner() {
  const { subscriptionStatus, isLoading } = useSubscription();

  // Don't show while loading
  if (isLoading) {
    return null;
  }

  // Show banner for inactive/problematic subscription statuses
  const inactiveStatuses = [
    "none",
    "canceled",
    "incomplete_expired",
    "incomplete",
    "unpaid",
    "past_due",
  ];

  const isInactive =
    !subscriptionStatus ||
    inactiveStatuses.includes(subscriptionStatus.toLowerCase());

  if (!isInactive) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500 backdrop-blur-sm text-red-200 p-4 rounded-xl flex items-start gap-4 shadow-2xl mb-6">
      <div className="bg-red-500/20 p-3 rounded-full flex-shrink-0">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg text-white mb-1">
          Your subscription is inactive
        </p>
        <p className="text-sm text-red-200 mb-4">
          Please update your plan to continue using Synth.
        </p>
        <Link href="/billing">
          <Button
            variant="default"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Go to Billing Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}

