"use client";

import { useState, useCallback } from "react";

interface BillingInfo {
  has_customer: boolean;
  has_subscription: boolean;
  has_payment_method: boolean;
  subscription: Record<string, unknown> | null;
  payment_method: Record<string, unknown> | null;
  upcoming_invoice: Record<string, unknown> | null;
}

export function useBilling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSetupIntent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create setup intent");
      }

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(
    async (planPriceId: string, addOnPriceIds: string[], paymentMethodId?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/billing/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_price_id: planPriceId,
            add_on_price_ids: addOnPriceIds,
            payment_method_id: paymentMethodId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create subscription");
        }

        return data;
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const switchPlan = useCallback(async (newPlanPriceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/switch-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_plan_price_id: newPlanPriceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to switch plan");
      }

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const manageAddons = useCallback(async (addOnPriceIds: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/manage-addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add_on_price_ids: addOnPriceIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to manage add-ons");
      }

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/update-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payment method");
      }

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(
    async (cancelAtPeriodEnd: boolean = true) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/billing/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancel_at_period_end: cancelAtPeriodEnd }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to cancel subscription");
        }

        return data;
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getBillingInfo = useCallback(async (): Promise<BillingInfo> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/info", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get billing info");
      }

      return data;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createSetupIntent,
    createSubscription,
    switchPlan,
    manageAddons,
    updatePaymentMethod,
    cancelSubscription,
    getBillingInfo,
  };
}
