"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
import type { SubscriptionState, SubscriptionPlan } from "@/lib/subscription";
import { mapPlanToSubscriptionPlan, getLogRetentionDays } from "@/lib/subscription";

interface SubscriptionContextType extends SubscriptionState {
  planName: string | null; // Legacy support
  setSubscribed: (subscribed: boolean, plan?: string) => void;
  requireSubscription: (feature?: string) => boolean;
  openSubscriptionModal: (feature?: string) => void;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    plan: "none",
    isSubscribed: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState<string | undefined>();

  // Fetch billing state on mount
  useEffect(() => {
    const fetchBillingState = async () => {
      try {
        const response = await fetch("/api/billing/state");
        const data = await response.json();
        
        // Map backend plan to SubscriptionPlan
        const plan = mapPlanToSubscriptionPlan(data.plan);
        // Use the new enum field (SUBSCRIBED/UNSUBSCRIBED) as primary source
        // Fallback to legacy field check for backward compatibility
        const subscriptionStatusEnum = data.subscriptionStatus; // Should be "SUBSCRIBED" or "UNSUBSCRIBED"
        const isSubscribed = subscriptionStatusEnum === "SUBSCRIBED" || 
          (plan !== "none" && subscriptionStatusEnum !== "UNSUBSCRIBED" && 
           (data.subscriptionStatusLegacy === "active" || data.subscriptionStatusLegacy === "trialing"));
        const isTrial = data.subscriptionStatusLegacy === "trialing";
        
        // Build usage from API response
        const usage = data.usage_limits ? {
          activeWorkflowsUsed: data.usage_limits.workflows?.current ?? 0,
          activeWorkflowsLimit: data.usage_limits.workflows?.max ?? null,
          executionsUsed: data.usage_limits.executions?.current ?? 0,
          executionsLimit: data.usage_limits.executions?.max ?? null,
          logRetentionDays: isSubscribed ? getLogRetentionDays(plan) : 0,
        } : undefined;

        setSubscriptionState({
          plan,
          isSubscribed,
          isTrial,
          renewalDate: data.subscriptionRenewalAt ?? null,
          billingCycle: data.billingPeriod ?? null,
          usage,
        });
      } catch (error) {
        console.error("Error fetching billing state:", error);
        setSubscriptionState({
          plan: "none",
          isSubscribed: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingState();
  }, []);

  const setSubscribed = (subscribed: boolean, plan?: string) => {
    const mappedPlan = plan ? mapPlanToSubscriptionPlan(plan) : "none";
    setSubscriptionState({
      plan: mappedPlan,
      isSubscribed: subscribed && mappedPlan !== "none",
    });
  };

  const openSubscriptionModal = useCallback((feature?: string) => {
    setModalFeature(feature);
    setModalOpen(true);
  }, []);

  const requireSubscription = useCallback((feature?: string): boolean => {
    if (subscriptionState.isSubscribed) return true;
    openSubscriptionModal(feature);
    return false;
  }, [subscriptionState.isSubscribed, openSubscriptionModal]);

  // Legacy planName for backward compatibility
  const planName = subscriptionState.plan !== "none" ? subscriptionState.plan : null;

  return (
    <SubscriptionContext.Provider value={{ 
      ...subscriptionState,
      planName, 
      setSubscribed,
      requireSubscription,
      openSubscriptionModal,
      isLoading
    }}>
      {children}
      <SubscriptionModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        feature={modalFeature}
      />
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
