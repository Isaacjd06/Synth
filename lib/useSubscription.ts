"use client";

import { useSession } from "./useSession";
import { useMemo } from "react";

interface SubscriptionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar_url?: string | null;
  subscriptionStatus?: string | null;
  plan?: string | null;
  trialEndsAt?: Date | string | null;
}

export interface UseSubscriptionReturn {
  isActive: boolean;
  isTrialValid: boolean;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  user: SubscriptionUser | null;
  isLoading: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const subscriptionData = useMemo(() => {
    const user = session?.user as SubscriptionUser | undefined;

    if (!user) {
      return {
        isActive: false,
        isTrialValid: false,
        subscriptionStatus: null,
        trialEndsAt: null,
        user: null,
        isLoading,
      };
    }

    const subscriptionStatus = user.subscriptionStatus || null;
    const trialEndsAtRaw = user.trialEndsAt;
    
    // Convert trial_ends_at to Date if it's a string
    const trialEndsAt = trialEndsAtRaw
      ? typeof trialEndsAtRaw === "string"
        ? new Date(trialEndsAtRaw)
        : trialEndsAtRaw instanceof Date
        ? trialEndsAtRaw
        : null
      : null;

    // Check if subscription is active (active or trialing status)
    const isActive =
      subscriptionStatus === "active" || subscriptionStatus === "trialing";

    // Check if trial is still valid (trial_ends_at is in the future)
    const isTrialValid =
      trialEndsAt !== null && trialEndsAt > new Date();

    return {
      isActive,
      isTrialValid,
      subscriptionStatus,
      trialEndsAt,
      user,
      isLoading,
    };
  }, [session, isLoading]);

  return subscriptionData;
}

