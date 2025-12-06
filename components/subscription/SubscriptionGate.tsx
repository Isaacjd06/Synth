"use client";

import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { Loader2 } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

/**
 * Client component wrapper that uses useSubscriptionGate hook
 * Redirects to /billing if no active subscription
 * Shows loading spinner while checking
 */
export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { allowed, loading } = useSubscriptionGate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking subscription...</span>
        </div>
      </div>
    );
  }

  if (!allowed) {
    // Hook will handle redirect, but show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Redirecting to billing...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

