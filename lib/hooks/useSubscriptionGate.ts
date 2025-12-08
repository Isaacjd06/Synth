"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SubscriptionInfo {
  subscription: {
    status: string;
  } | null;
}

interface UseSubscriptionGateReturn {
  allowed: boolean;
  loading: boolean;
}

/**
 * Client-side hook to gate pages behind active subscription
 * Fetches subscription status from /api/billing/info
 * Redirects to /billing if no active subscription
 * 
 * Returns { allowed: boolean, loading: boolean }
 */
export function useSubscriptionGate(): UseSubscriptionGateReturn {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch("/api/billing/info");
        
        if (!response.ok) {
          // If unauthorized or error, redirect to billing
          router.push("/billing");
          return;
        }

        const data: SubscriptionInfo = await response.json();
        
        // Check if subscription is active
        const subscriptionStatus = data.subscription?.status;
        
        // Allow: "active", "trialing", "past_due" (if not canceled)
        // Block: "none", "canceled", "incomplete_expired", "incomplete", "unpaid"
        const blockedStatuses = [
          "none",
          "canceled",
          "incomplete_expired",
          "incomplete",
          "unpaid",
        ];

        const isBlocked = subscriptionStatus
          ? blockedStatuses.includes(subscriptionStatus.toLowerCase())
          : true; // Block if no subscription

        if (isBlocked) {
          // No active subscription, redirect to billing
          router.push("/billing");
          setAllowed(false);
        } else {
          // Active subscription, allow access
          setAllowed(true);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        // On error, redirect to billing to be safe
        router.push("/billing");
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [router]);

  return { allowed, loading };
}

