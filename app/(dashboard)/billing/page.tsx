"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Check, CreditCard, AlertCircle, Loader2, Download, Calendar, X, RotateCcw } from "lucide-react";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// Define plans
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for individuals getting started",
    price: "$29",
    features: [
      "5 workflows",
      "Basic AI automation",
      "Community support",
      "Standard integrations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professionals and growing teams",
    price: "$99",
    features: [
      "Unlimited workflows",
      "Advanced AI automation",
      "Priority support",
      "Custom integrations",
      "Workflow analytics",
    ],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    description: "For agencies and large teams",
    price: "$299",
    features: [
      "Everything in Pro",
      "White-label options",
      "Dedicated support",
      "Custom development",
      "SLA guarantee",
    ],
  },
];

// Define one-time add-ons
const ADDONS = [
  {
    id: "rapid_booster",
    name: "Rapid Automation Booster",
    description: "Accelerate your workflow automation capabilities",
  },
  {
    id: "performance_turbo",
    name: "Workflow Performance Turbo",
    description: "Boost workflow execution speed and efficiency",
  },
  {
    id: "business_jumpstart",
    name: "Business Systems Jumpstart",
    description: "Get your business systems up and running faster",
  },
  {
    id: "persona_training",
    name: "AI Persona Training",
    description: "Train custom AI personas for your workflows",
  },
  {
    id: "unlimited_knowledge",
    name: "Unlimited Knowledge Injection",
    description: "Unlimited knowledge base capacity",
  },
];

interface BillingState {
  plan: string | null;
  subscriptionStatus: string | null;
  subscriptionRenewalAt: string | null;
  addOns: string[];
  stripeCustomerId: string | null;
  hasPaymentMethod: boolean;
}

interface PaymentMethodDetails {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

// Payment Form Component (must be inside Elements)
function PaymentForm({
  clientSecret,
  onSuccess,
  onError,
  isLoading,
  submitButtonText = "Confirm & Subscribe",
}: {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  submitButtonText?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the SetupIntent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error) {
        const message = error.message || "An error occurred";
        setErrorMessage(message);
        onError(message);
        setProcessing(false);
        return;
      }

      if (setupIntent && setupIntent.payment_method) {
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method.id;

        onSuccess(paymentMethodId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 p-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {(processing || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
        {processing || isLoading ? "Processing..." : submitButtonText}
      </button>
    </form>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [billingState, setBillingState] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showUpdatePaymentForm, setShowUpdatePaymentForm] = useState(false);
  const [updatePaymentClientSecret, setUpdatePaymentClientSecret] = useState<string | null>(null);
  const [purchasingAddon, setPurchasingAddon] = useState<string | null>(null);
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [purchaseLogs, setPurchaseLogs] = useState<unknown[]>([]);
  const [invoices, setInvoices] = useState<unknown[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [upcomingInvoice, setUpcomingInvoice] = useState<unknown>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [paymentMethodDetails, setPaymentMethodDetails] = useState<PaymentMethodDetails | null>(null);
  const [savePaymentMethodClientSecret, setSavePaymentMethodClientSecret] = useState<string | null>(null);
  const [showSavePaymentForm, setShowSavePaymentForm] = useState(false);
  const [paymentMethodSaved, setPaymentMethodSaved] = useState(false);

  const fetchBillingState = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/billing/state");
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to fetch billing state");
      }

      const data: BillingState = await response.json();
      setBillingState(data);

      // Set current plan if user has one
      // The plan field contains the Stripe price ID, so we need to map it to plan identifier
      if (data.plan) {
        const starterPriceId = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || "";
        const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "";
        const agencyPriceId = process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID || "";
        const starterYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || "";
        const proYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "";
        const agencyYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_AGENCY_YEARLY_PRICE_ID || "";
        
        if (data.plan === starterPriceId || data.plan === starterYearlyPriceId) {
          setSelectedPlan("starter");
          if (data.plan === starterYearlyPriceId) setBillingInterval("yearly");
        } else if (data.plan === proPriceId || data.plan === proYearlyPriceId) {
          setSelectedPlan("pro");
          if (data.plan === proYearlyPriceId) setBillingInterval("yearly");
        } else if (data.plan === agencyPriceId || data.plan === agencyYearlyPriceId) {
          setSelectedPlan("agency");
          if (data.plan === agencyYearlyPriceId) setBillingInterval("yearly");
        }
      }

      // Set current add-ons
      setSelectedAddOns(data.addOns || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load billing information");
      } else {
        setError("Failed to load billing information");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseLogs = async () => {
    try {
      const response = await fetch("/api/billing/purchase-log");
      if (response.ok) {
        const data = await response.json();
        setPurchaseLogs(data.purchases || []);
      }
    } catch (err: unknown) {
      // Silently fail - purchase logs are not critical
      console.error("Failed to fetch purchase logs:", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/billing/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      // Silently fail - invoices are not critical
      console.error("Failed to fetch invoices:", err);
    }
  };

  const fetchUpcomingInvoice = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/info");
      if (response.ok) {
        const data = await response.json();
        if (data.upcoming_invoice) {
          setUpcomingInvoice(data.upcoming_invoice);
        }
      }
    } catch (err) {
      // Silently fail
      console.error("Failed to fetch upcoming invoice:", err);
    }
  }, []);

  const fetchPaymentMethodDetails = async () => {
    try {
      const response = await fetch("/api/billing/info");
      if (response.ok) {
        const data = await response.json();
        if (data.payment_method) {
          setPaymentMethodDetails({
            brand: data.payment_method.brand,
            last4: data.payment_method.last4,
            exp_month: data.payment_method.exp_month,
            exp_year: data.payment_method.exp_year,
          });
        }
      }
    } catch (err) {
      // Silently fail
      console.error("Failed to fetch payment method details:", err);
    }
  };

  const initializeSavePaymentMethod = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Ensure customer exists
      const customerResponse = await fetch("/api/billing/create-customer", {
        method: "POST",
      });

      if (!customerResponse.ok) {
        const data = await customerResponse.json();
        throw new Error(data.error || "Failed to create customer");
      }

      // Create setup intent
      const setupIntentResponse = await fetch("/api/billing/create-setup-intent", {
        method: "POST",
      });

      if (!setupIntentResponse.ok) {
        const data = await setupIntentResponse.json();
        throw new Error(data.error || "Failed to create setup intent");
      }

      const data = await setupIntentResponse.json();
      setSavePaymentMethodClientSecret(data.clientSecret);
      setShowSavePaymentForm(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment method setup");
      setShowSavePaymentForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializePayment = useCallback(async () => {
    try {
      setIsSubmitting(true);
      // Ensure customer exists
      const customerResponse = await fetch("/api/billing/create-customer", {
        method: "POST",
      });

      if (!customerResponse.ok) {
        const data = await customerResponse.json();
        throw new Error(data.error || "Failed to create customer");
      }

      // Create setup intent
      const setupIntentResponse = await fetch("/api/billing/create-setup-intent", {
        method: "POST",
      });

      if (!setupIntentResponse.ok) {
        const data = await setupIntentResponse.json();
        throw new Error(data.error || "Failed to create setup intent");
      }

      const data = await setupIntentResponse.json();
      setClientSecret(data.clientSecret);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
      setShowPaymentForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const initializeUpdatePayment = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage("Updating payment method...");

      // Create setup intent for updating payment method
      const setupIntentResponse = await fetch("/api/billing/create-setup-intent", {
        method: "POST",
      });

      if (!setupIntentResponse.ok) {
        const data = await setupIntentResponse.json();
        throw new Error(data.error || "Failed to create setup intent");
      }

      const data = await setupIntentResponse.json();
      setUpdatePaymentClientSecret(data.clientSecret);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment method update");
      setShowUpdatePaymentForm(false);
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setError(null);
    setSuccessMessage(null);
  };

  const handleAddOnToggle = (addonId: string) => {
    // Prevent selecting add-ons that are already owned (one-time purchases)
    // These should not be included in subscription creation
    if (billingState?.addOns.includes(addonId)) {
      setError("This add-on is already owned and cannot be added to subscription");
      return;
    }

    setSelectedAddOns((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    // If saving payment method (standalone, not for subscription)
    if (showSavePaymentForm && !showUpdatePaymentForm) {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/billing/update-payment-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_method_id: paymentMethodId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || data.error || "Failed to save payment method");
        }

        setSuccessMessage("Payment method saved successfully!");
        setPaymentMethodSaved(true);
        setShowSavePaymentForm(false);
        setSavePaymentMethodClientSecret(null);
        await fetchBillingState();
        await fetchPaymentMethodDetails();
        
        setTimeout(() => {
          setPaymentMethodSaved(false);
          router.refresh();
        }, 2000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save payment method";
        setError(`Error saving payment method: ${message}`);
        setSuccessMessage(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // If updating payment method (not creating subscription)
    if (showUpdatePaymentForm) {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/billing/update-payment-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_method_id: paymentMethodId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || data.error || "Failed to update payment method");
        }

        setSuccessMessage("Payment method updated successfully!");
        setShowUpdatePaymentForm(false);
        setUpdatePaymentClientSecret(null);
        await fetchBillingState();
        await fetchPaymentMethodDetails();
        
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update payment method";
        setError(`Error updating payment method: ${message}`);
        setSuccessMessage(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Original subscription creation flow
    if (!selectedPlan) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Filter out add-ons that are already owned (one-time purchases)
      // These should not be included in subscription creation
      const ownedAddons = billingState?.addOns || [];
      const subscriptionAddons = selectedAddOns.filter(
        (addonId) => !ownedAddons.includes(addonId)
      );

      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          addons: subscriptionAddons,
          billingInterval,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to create subscription");
      }

      setSuccessMessage("Subscription created successfully!");
      setShowPaymentForm(false);
      setClientSecret(null);
      await fetchBillingState();
      
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    setShowUpdatePaymentForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleConfirmAndSubscribe = async () => {
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    // If user has payment method, create subscription directly
    if (billingState?.hasPaymentMethod) {
      setIsSubmitting(true);
      try {
        // Filter out add-ons that are already owned (one-time purchases)
        // These should not be included in subscription creation
        const ownedAddons = billingState?.addOns || [];
        const subscriptionAddons = selectedAddOns.filter(
          (addonId) => !ownedAddons.includes(addonId)
        );

        const response = await fetch("/api/billing/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: selectedPlan,
            addons: subscriptionAddons,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || data.error || "Failed to create subscription");
        }

        setSuccessMessage("Subscription created successfully!");
        await fetchBillingState();
        setTimeout(() => router.refresh(), 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create subscription");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Show payment form
      setShowPaymentForm(true);
      if (!clientSecret) {
        await initializePayment();
      }
    }
  };

  const handleSwitchPlan = async (newPlanId: string, skipPreview = false) => {
    // Prevent switching to the same plan
    if (!newPlanId || newPlanId === selectedPlan) return;

    // Show upcoming invoice preview if available and not skipped
    if (!skipPreview && billingState?.stripeCustomerId) {
      await fetchUpcomingInvoice();
      if (upcomingInvoice) {
        setSwitchingPlan(newPlanId);
        setShowInvoicePreview(true);
        return;
      }
    }

    // Disable all buttons and set loading state
    setSwitchingPlan(newPlanId);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Show temporary loading message
      setSuccessMessage("Updating your plan...");

      const response = await fetch("/api/billing/switch-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlan: newPlanId,
          billingInterval,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to switch plan");
      }

      // Show success confirmation
      setSuccessMessage("Plan updated! Changes will take effect at the next billing period.");
      
      // Refresh billing state to get updated plan
      await fetchBillingState();
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      // Show error alert
      setError(err instanceof Error ? err.message : "Failed to switch plan");
      setSuccessMessage(null);
    } finally {
      setSwitchingPlan(null);
      setIsSubmitting(false);
    }
  };

  const handlePurchaseAddon = async (addonId: string) => {
    // Prevent purchasing if already owned
    if (billingState?.addOns.includes(addonId)) {
      setError("You already own this add-on");
      return;
    }

    // Prevent rapid double-purchases
    if (purchasingAddon) {
      return;
    }

    // Disable all buttons and set loading state
    setPurchasingAddon(addonId);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Show processing message
      setSuccessMessage("Processing payment...");

      const response = await fetch("/api/billing/purchase-addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addon: addonId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "ADDON_ALREADY_OWNED") {
          throw new Error(data.message || "You already own this add-on");
        }
        throw new Error(data.message || data.error || "Failed to purchase add-on");
      }

      // Show success alert
      setSuccessMessage("Add-on purchased successfully!");
      
      // Update state to reflect ownership
      await fetchBillingState();
      await fetchPurchaseLogs();
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      // Show error with payment failure message
      const message = err instanceof Error ? err.message : "Failed to purchase add-on";
      setError(`Payment failed: ${message}`);
      setSuccessMessage(null);
    } finally {
      setPurchasingAddon(null);
      setIsSubmitting(false);
    }
  };

  // Fetch billing state on mount
  useEffect(() => {
    fetchBillingState();
    fetchPurchaseLogs();
    fetchInvoices();
  }, []);

  // Fetch payment method details if user has a payment method
  useEffect(() => {
    if (billingState?.hasPaymentMethod) {
      fetchPaymentMethodDetails();
      setShowSavePaymentForm(false);
      setSavePaymentMethodClientSecret(null);
    } else {
      setPaymentMethodDetails(null);
      // Automatically show Payment Element if user has no payment method
      if (!billingState?.hasPaymentMethod && !showSavePaymentForm && !savePaymentMethodClientSecret) {
        setShowSavePaymentForm(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingState?.hasPaymentMethod]);

  // Initialize setup intent for saving payment method when form should be shown
  useEffect(() => {
    if (showSavePaymentForm && !savePaymentMethodClientSecret && !billingState?.hasPaymentMethod && billingState !== null && !loading) {
      initializeSavePaymentMethod();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSavePaymentForm, savePaymentMethodClientSecret, billingState?.hasPaymentMethod, loading]);

  // Fetch upcoming invoice when switching plans
  useEffect(() => {
    if (switchingPlan && billingState?.stripeCustomerId) {
      fetchUpcomingInvoice();
    }
  }, [switchingPlan, billingState?.stripeCustomerId, fetchUpcomingInvoice]);

  // Initialize setup intent when payment form should be shown
  useEffect(() => {
    if (showPaymentForm && !clientSecret && !billingState?.hasPaymentMethod) {
      initializePayment();
    }
  }, [showPaymentForm, clientSecret, billingState?.hasPaymentMethod, initializePayment]);

  // Initialize setup intent when update payment form should be shown
  useEffect(() => {
    if (showUpdatePaymentForm && !updatePaymentClientSecret && billingState?.hasPaymentMethod) {
      initializeUpdatePayment();
    }
  }, [showUpdatePaymentForm, updatePaymentClientSecret, billingState?.hasPaymentMethod, initializeUpdatePayment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  const hasPaymentMethod = billingState?.hasPaymentMethod || false;
  const hasSubscription = billingState?.subscriptionStatus &&
    ["active", "trialing", "past_due", "cancels_at_period_end"].includes(billingState.subscriptionStatus);
  const isPastDue = billingState?.subscriptionStatus === "past_due";
  const isCanceling = billingState?.subscriptionStatus === "cancels_at_period_end";

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancel_at_period_end: true,
          reason: cancelReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to cancel subscription");
      }

      setSuccessMessage("Subscription will be canceled at the end of the billing period.");
      setShowCancelModal(false);
      setCancelReason("");
      await fetchBillingState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/reactivate-subscription", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || "Failed to reactivate subscription");
      }

      setSuccessMessage("Subscription reactivated successfully!");
      await fetchBillingState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reactivate subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Billing & Subscription
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your subscription, payment method, and billing information
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500/50 backdrop-blur-sm text-green-300 p-4 rounded-xl flex items-start gap-3 shadow-lg">
            {successMessage.includes("Updating") || successMessage.includes("Processing payment") ? (
              <Loader2 className="w-5 h-5 mt-0.5 flex-shrink-0 animate-spin" />
            ) : (
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500/50 backdrop-blur-sm text-red-300 p-4 rounded-xl flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Failed Payment Warning Banner */}
        {isPastDue && (
          <div className="bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500 backdrop-blur-sm text-red-200 p-6 rounded-xl flex items-start gap-4 shadow-2xl">
            <div className="bg-red-500/20 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-white">Payment Failed</p>
              <p className="text-sm mt-1 text-red-200">Your last payment failed. Please update your payment method to continue service.</p>
              <button
                onClick={handleUpdatePaymentMethod}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 text-sm shadow-lg hover:shadow-red-500/50"
              >
                Update Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Payment Method Section */}
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment Method
            </CardTitle>
            <CardDescription className="text-gray-400">
              {hasPaymentMethod
                ? "Manage your saved payment method"
                : "Add a payment method to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPaymentMethod && paymentMethodDetails ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold capitalize text-lg">
                        {paymentMethodDetails.brand} •••• {paymentMethodDetails.last4}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Expires {paymentMethodDetails.exp_month}/{paymentMethodDetails.exp_year}
                      </div>
                    </div>
                  </div>
                  {!showUpdatePaymentForm && (
                    <button
                      onClick={handleUpdatePaymentMethod}
                      disabled={isSubmitting || !!switchingPlan || !!purchasingAddon || !!showPaymentForm || showSavePaymentForm}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm shadow-lg hover:shadow-blue-500/50"
                    >
                      Update
                    </button>
                  )}
                </div>
                {paymentMethodSaved && (
                  <div className="bg-green-900/20 border border-green-500/50 text-green-300 p-3 rounded-lg text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Payment method saved successfully</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-800/30 border border-dashed border-gray-600 rounded-xl">
                <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  No payment method on file. Add one below to enable subscriptions and add-on purchases.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Payment Method Form (shown when user has no payment method) */}
        {showSavePaymentForm && savePaymentMethodClientSecret && !hasPaymentMethod && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Add Payment Method</CardTitle>
              <CardDescription>
                Enter your payment information to save a payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: savePaymentMethodClientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#3b82f6',
                      colorBackground: '#111827',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={savePaymentMethodClientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={(err: string) => setError(err)}
                  isLoading={isSubmitting}
                  submitButtonText="Save Payment Method"
                />
              </Elements>
              <button
                onClick={() => {
                  setShowSavePaymentForm(false);
                  setSavePaymentMethodClientSecret(null);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </CardContent>
          </Card>
        )}

        {/* Billing Settings Section */}
        {hasSubscription && billingState && (
          <Card className="border-blue-700/50 bg-blue-900/10">
            <CardHeader>
              <CardTitle className="text-white">Billing Settings</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  billingState.subscriptionStatus === "active" || billingState.subscriptionStatus === "trialing"
                    ? "bg-green-600 text-white"
                    : billingState.subscriptionStatus === "past_due"
                    ? "bg-red-600 text-white"
                    : billingState.subscriptionStatus === "cancels_at_period_end"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-600 text-white"
                }`}>
                  {billingState.subscriptionStatus === "cancels_at_period_end" ? "Canceling" : 
                   billingState.subscriptionStatus === "past_due" ? "Past Due" :
                   billingState.subscriptionStatus?.toUpperCase() || "Unknown"}
                </span>
              </div>

              {/* Subscription Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Subscription Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Started:</span>
                    <span className="text-white">
                      {billingState.subscriptionRenewalAt
                        ? new Date(billingState.subscriptionRenewalAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  {billingState.subscriptionRenewalAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Next renewal:</span>
                      <span className="text-white">
                        {new Date(billingState.subscriptionRenewalAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {isCanceling && billingState.subscriptionRenewalAt && (
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400">Cancels on:</span>
                      <span className="text-yellow-400">
                        {new Date(billingState.subscriptionRenewalAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-sm text-gray-400">Current Plan</p>
                  <p className="text-white font-medium">
                    {PLANS.find((p) => p.id === selectedPlan)?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Billing Email</p>
                  <p className="text-white font-medium">
                    {billingState.stripeCustomerId ? "On file" : "Not set"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                {isCanceling && (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reactivate Subscription
                  </button>
                )}
                {!isCanceling && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selector - Only show if user has payment method or subscription */}
        {(hasPaymentMethod || hasSubscription) && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
            <p className="text-gray-400">Select the perfect plan for your needs</p>
          </div>
          
          {/* Billing Interval Toggle */}
          {!hasSubscription && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-white" : "text-gray-400"}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingInterval(billingInterval === "monthly" ? "yearly" : "monthly")}
                aria-label="Toggle billing interval"
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
                  billingInterval === "yearly" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                    billingInterval === "yearly" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${billingInterval === "yearly" ? "text-white" : "text-gray-400"}`}>
                Yearly
              </span>
              {billingInterval === "yearly" && (
                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full font-medium">
                  Save 20%
                </span>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = selectedPlan === plan.id && hasSubscription;
              const isSwitching = switchingPlan === plan.id;
              const showSwitchButton =
                hasSubscription &&
                hasPaymentMethod &&
                !isCurrentPlan &&
                !switchingPlan;

              return (
                <div
                  key={plan.id}
                  className={`relative group ${
                    plan.popular && !isCurrentPlan
                      ? "md:-mt-4 md:scale-105"
                      : ""
                  }`}
                >
                  <div
                    className={`relative h-full rounded-2xl p-6 transition-all duration-300 ${
                      isCurrentPlan
                        ? "bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500 shadow-2xl shadow-green-500/20"
                        : selectedPlan === plan.id
                        ? "bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-2 border-blue-500 shadow-2xl shadow-blue-500/20"
                        : plan.popular
                        ? "bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-2 border-blue-500/50 shadow-xl hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20"
                        : "bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 shadow-lg hover:border-gray-600 hover:shadow-xl"
                    }`}
                  >
                    {plan.popular && !isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          CURRENT PLAN
                        </span>
                      </div>
                    )}

                    <div className="text-center space-y-4 mb-6">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-white">
                          {billingInterval === "yearly" 
                            ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 12 * 0.8)}`
                            : plan.price}
                        </span>
                        <span className="text-gray-400 text-lg">
                          {billingInterval === "yearly" ? "/year" : "/month"}
                        </span>
                      </div>
                      {billingInterval === "yearly" && (
                        <div className="text-xs text-gray-500 line-through">
                          ${parseInt(plan.price.replace("$", "")) * 12}/year
                        </div>
                      )}
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300">
                          <div className="bg-green-500/20 p-1 rounded-full mt-0.5">
                            <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {!hasSubscription && (
                      <button
                        type="button"
                        onClick={() => handlePlanSelect(plan.id)}
                        disabled={isSubmitting || !!switchingPlan}
                        className={`w-full py-3 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                          selectedPlan === plan.id
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
                            : "bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white border-2 border-transparent hover:border-gray-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {selectedPlan === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" />
                            Selected
                          </span>
                        ) : (
                          "Select Plan"
                        )}
                      </button>
                    )}
                    {showSwitchButton && (
                      <button
                        onClick={() => handleSwitchPlan(plan.id)}
                        disabled={isSubmitting || !!switchingPlan}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                      >
                        Switch to {plan.name}
                      </button>
                    )}
                    {isSwitching && (
                      <div className="w-full bg-blue-600/50 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Switching...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Add-ons Selector - Only show if user has payment method or subscription */}
        {(hasPaymentMethod || hasSubscription) && (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Power-Ups & Add-ons</CardTitle>
            <CardDescription className="text-gray-400">Enhance your plan with additional features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ADDONS.map((addon) => {
                const isOwned = billingState?.addOns.includes(addon.id) || false;
                const isPurchasing = purchasingAddon === addon.id;
                const showPurchaseButton = !isOwned && hasPaymentMethod && hasSubscription;

                return (
                  <div
                    key={addon.id}
                    className={`relative p-5 rounded-xl border transition-all duration-200 ${
                      isOwned
                        ? "bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-500/50 shadow-lg"
                        : "bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700 hover:border-gray-600 hover:shadow-lg"
                    }`}
                  >
                    {isOwned && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
                          <Check className="w-3 h-3" />
                          OWNED
                        </span>
                      </div>
                    )}
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold text-lg pr-20">{addon.name}</h4>
                      <p className="text-sm text-gray-400">{addon.description}</p>

                      {showPurchaseButton && (
                        <div className="relative">
                          <button
                            onClick={() => handlePurchaseAddon(addon.id)}
                            disabled={isSubmitting || isPurchasing || !!switchingPlan || !!purchasingAddon || !hasSubscription}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50"
                            title={!hasSubscription ? "Requires active subscription" : undefined}
                          >
                            {isPurchasing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Purchase Add-on"
                            )}
                          </button>
                          {!hasSubscription && (
                            <div className="absolute -top-8 left-0 right-0 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded shadow-lg z-10">
                              Requires active subscription
                            </div>
                          )}
                        </div>
                      )}

                      {!hasSubscription && !isOwned && (
                        <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800/70 transition-colors border border-gray-700 hover:border-gray-600">
                          <input
                            type="checkbox"
                            checked={selectedAddOns.includes(addon.id)}
                            onChange={() => handleAddOnToggle(addon.id)}
                            className="w-5 h-5 text-blue-600 rounded border-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
                            disabled={isSubmitting || !!switchingPlan || !!purchasingAddon}
                          />
                          <span className={`text-sm font-medium transition-colors ${
                            selectedAddOns.includes(addon.id)
                              ? "text-blue-400"
                              : "text-gray-300"
                          }`}>
                            {selectedAddOns.includes(addon.id) ? (
                              <span className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Included in subscription
                              </span>
                            ) : (
                              "Include in subscription"
                            )}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Payment Element for Subscription (only shown if no payment method and not subscribed) */}
        {showPaymentForm && clientSecret && !hasPaymentMethod && !hasSubscription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Payment Details</CardTitle>
              <CardDescription>
                Enter your payment information to complete subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#3b82f6',
                      colorBackground: '#111827',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={(err: string) => setError(err)}
                  isLoading={isSubmitting}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Payment Element for Updating Payment Method */}
        {showUpdatePaymentForm && updatePaymentClientSecret && hasPaymentMethod && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Update Payment Method</CardTitle>
              <CardDescription>
                Enter your new payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: updatePaymentClientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#3b82f6',
                      colorBackground: '#111827',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={updatePaymentClientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={(err: string) => {
                    setError(`Error updating payment method: ${err}`);
                    setSuccessMessage(null);
                  }}
                  isLoading={isSubmitting}
                  submitButtonText="Update Payment Method"
                />
              </Elements>
              <button
                onClick={() => {
                  setShowUpdatePaymentForm(false);
                  setUpdatePaymentClientSecret(null);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </CardContent>
          </Card>
        )}

        {/* Invoice History */}
        {invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Invoice History</CardTitle>
              <CardDescription>View and download your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice: Record<string, unknown>) => (
                  <div
                    key={String(invoice.id)}
                    className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-900/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">
                          {String(invoice.number || invoice.id)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          invoice.status === "paid"
                            ? "bg-green-600 text-white"
                            : invoice.status === "open"
                            ? "bg-yellow-600 text-white"
                            : "bg-red-600 text-white"
                        }`}>
                          {typeof invoice.status === "string" ? invoice.status.toUpperCase() : "UNKNOWN"}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        {invoice.created && typeof invoice.created === "number" && new Date(invoice.created * 1000).toLocaleDateString()} • {formatCurrency(typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0, typeof invoice.currency === "string" ? invoice.currency : "usd")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.hosted_invoice_url && typeof invoice.hosted_invoice_url === "string" && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                      )}
                      {invoice.invoice_pdf && typeof invoice.invoice_pdf === "string" && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase History */}
        {purchaseLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Add-on Purchase History</CardTitle>
              <CardDescription>Your one-time add-on purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseLogs.map((log: Record<string, unknown>) => {
                  const addon = ADDONS.find((a) => a.id === log.addonId);
                  return (
                    <div
                      key={String(log.id)}
                      className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-900/50"
                    >
                      <div>
                        <div className="text-white font-medium">
                          {addon?.name || String(log.addonId)}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {typeof log.createdAt === "string" && new Date(log.createdAt).toLocaleDateString()} • {formatCurrency(typeof log.amount === "number" ? log.amount : 0, typeof log.currency === "string" ? log.currency : "usd")}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.status === "succeeded"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}>
                        {typeof log.status === "string" ? log.status.toUpperCase() : "UNKNOWN"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm & Subscribe Button (only shown if no subscription) */}
        {!hasSubscription && selectedPlan && !showPaymentForm && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleConfirmAndSubscribe}
              disabled={isSubmitting || !selectedPlan || !!switchingPlan}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-xl transition-all duration-200 flex items-center gap-3 text-lg shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transform"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  Confirm & Subscribe
                </>
              )}
            </button>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-white font-semibold text-lg mb-4">Cancel Subscription</h3>
              <p className="text-gray-400 text-sm mb-4">
                We&apos;re sorry to see you go. Please let us know why you&apos;re canceling:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
                placeholder="Enter your reason..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 resize-none h-24 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isSubmitting || !cancelReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Canceling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Invoice Preview Modal */}
        {showInvoicePreview && upcomingInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-white font-semibold text-lg mb-4">Upcoming Invoice Preview</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(
                      typeof upcomingInvoice === "object" && upcomingInvoice !== null && "amount_due" in upcomingInvoice && typeof upcomingInvoice.amount_due === "number" ? upcomingInvoice.amount_due : 0,
                      typeof upcomingInvoice === "object" && upcomingInvoice !== null && "currency" in upcomingInvoice && typeof upcomingInvoice.currency === "string" ? upcomingInvoice.currency : "usd"
                    )}
                  </span>
                </div>
                {typeof upcomingInvoice === "object" && upcomingInvoice !== null && "period_start" in upcomingInvoice && upcomingInvoice.period_start && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Billing Period:</span>
                    <span className="text-white">
                      {typeof upcomingInvoice.period_start === "number" && new Date(upcomingInvoice.period_start * 1000).toLocaleDateString()} - {"period_end" in upcomingInvoice && typeof upcomingInvoice.period_end === "number" ? new Date(upcomingInvoice.period_end * 1000).toLocaleDateString() : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInvoicePreview(false);
                    setUpcomingInvoice(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowInvoicePreview(false);
                    if (switchingPlan) {
                      await handleSwitchPlan(switchingPlan, true);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Confirm Switch
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
