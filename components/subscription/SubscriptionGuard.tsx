"use client";

import { useSubscription } from "@/lib/useSubscription";
import SubscriptionStatusBanner from "./SubscriptionStatusBanner";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isActive, isTrialValid, subscriptionStatus, trialEndsAt, isLoading } = useSubscription();

  const hasValidSubscription = isActive || isTrialValid;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Subscription Status Banner */}
      <div className="mb-6">
        <SubscriptionStatusBanner
          subscriptionStatus={subscriptionStatus}
          trialEndsAt={trialEndsAt}
        />
      </div>

      {/* Content with overlay if inactive */}
      <div className="relative">
        {/* Blocking overlay for inactive subscriptions */}
        {!hasValidSubscription && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm rounded-lg min-h-[400px]">
            <div className="text-center p-8 max-w-md">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-red-900/20 rounded-full border border-red-700/50">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Subscription Required
              </h2>
              <p className="text-gray-400 mb-6">
                Your Synth subscription is inactive. Upgrade to continue using
                this feature.
              </p>
              <Link href="/billing">
                <Button size="lg" className="w-full sm:w-auto">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Original content - blurred if inactive */}
        <div
          className={!hasValidSubscription ? "opacity-30 pointer-events-none" : ""}
        >
          {children}
        </div>
      </div>
    </>
  );
}

