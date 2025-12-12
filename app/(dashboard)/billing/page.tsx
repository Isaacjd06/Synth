"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  X,
  Loader2,
  Settings,
  Package,
  BarChart3,
  Shield,
  RefreshCw,
} from "lucide-react";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { synthToast } from "@/lib/synth-toast";
import { useStripePrices, StripePlan, StripeAddon } from "@/hooks/use-stripe-prices";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentMethodModal from "@/components/billing/PaymentMethodModal";

// Subscription type
interface SubscriptionData {
  planId: string;
  planName: string;
  status: "active" | "trialing" | "past_due" | "canceling" | "canceled";
  billingInterval: "monthly" | "yearly";
  renewalDate: string;
  trialEndDate?: string;
  ownedAddons: string[];
  usageLimits: {
    workflowsUsed: number;
    workflowsLimit: number;
    executionsUsed: number;
    executionsLimit: number;
  };
  paymentMethod: {
    type: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

// Default subscription data - always have an active subscription
const defaultSubscription: SubscriptionData = {
  planId: "pro",
  planName: "Pro",
  status: "active",
  billingInterval: "monthly",
  renewalDate: "2025-01-14",
  ownedAddons: [],
  usageLimits: {
    workflowsUsed: 8,
    workflowsLimit: 25,
    executionsUsed: 1847,
    executionsLimit: 10000,
  },
  paymentMethod: {
    type: "card",
    last4: "4242",
    brand: "Visa",
    expiryMonth: 12,
    expiryYear: 2026,
  },
};

const mockInvoices = [
  { id: "INV-001", date: "2025-01-01", amount: 149, status: "paid" },
  { id: "INV-002", date: "2024-12-01", amount: 149, status: "paid" },
  { id: "INV-003", date: "2024-11-01", amount: 49, status: "paid" },
];

const mockPurchaseLog = [
  { addon: "Business Systems Jumpstart", date: "2024-12-15", amount: 500, status: "completed" },
];

export default function BillingPage() {
  const { plans, addons, loading: pricesLoading, error: pricesError } = useStripePrices();
  const [subscription, setSubscription] = useState<SubscriptionData>(defaultSubscription);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showStartSubscriptionModal, setShowStartSubscriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cancelConfirmation, setCancelConfirmation] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changePlanLoading, setChangePlanLoading] = useState(false);

  const isCancelConfirmValid = cancelConfirmation === "UNSUBSCRIBE";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPrice = (plan: StripePlan) => {
    return billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getMonthlyEquivalent = (plan: StripePlan) => {
    return billingInterval === "yearly"
      ? Math.round(plan.yearlyPrice / 12)
      : plan.monthlyPrice;
  };

  const handlePlanSelect = (planId: string) => {
    // Always set the selected plan (not toggle)
    setSelectedPlan(planId);
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };
  
  const handleCancelSubscription = async () => {
    if (!isCancelConfirmValid) return;
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 1500));

      setIsSubscribed(false);
      setShowCancelModal(false);
      setCancelConfirmation("");
      setCancelReason("");
      synthToast.success("Subscription Canceled", "Your plan has been canceled.");
    } catch (error) {
      setErrorMessage("Failed to cancel subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSubscription = async () => {
    if (!selectedPlan) return;
    
    // Check if payment method exists
    const hasPaymentMethod = subscription.paymentMethod.last4;
    
    if (!hasPaymentMethod) {
      synthToast.error("Payment Method Required", "Please add a payment method before subscribing.");
      setShowPaymentModal(true);
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const planData = plans.find(p => p.id === selectedPlan);
      if (planData) {
        setSubscription({
          ...subscription,
          planId: selectedPlan,
          planName: planData.name,
          status: "active",
          billingInterval,
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          usageLimits: {
            workflowsUsed: 0,
            workflowsLimit: selectedPlan === "starter" ? 5 : selectedPlan === "pro" ? 25 : 100,
            executionsUsed: 0,
            executionsLimit: selectedPlan === "starter" ? 1000 : selectedPlan === "pro" ? 10000 : 50000,
          },
        });
        setIsSubscribed(true);
        setShowStartSubscriptionModal(false);
        setSelectedPlan(null);
        synthToast.success("Subscription Started", `Welcome to ${planData.name}!`);
      }
    } catch (error) {
      synthToast.error("Subscription Failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentMethodUpdate = (newCard: { brand: string; last4: string; expiryMonth: number; expiryYear: number }) => {
    if (subscription) {
      setSubscription({
        ...subscription,
        paymentMethod: {
          type: "card",
          last4: newCard.last4,
          brand: newCard.brand,
          expiryMonth: newCard.expiryMonth,
          expiryYear: newCard.expiryYear,
        },
      });
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || selectedPlan === subscription.planId) return;
    
    setChangePlanLoading(true);
    
    try {
      // Simulate API call to change plan
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newPlan = plans.find(p => p.id === selectedPlan);
      if (newPlan) {
        // Update subscription state with new plan
        setSubscription({
          ...subscription,
          planId: selectedPlan,
          planName: newPlan.name,
        });
        
        synthToast.success("Plan Changed", `Your plan has been updated to ${newPlan.name}. Changes take effect next billing cycle.`);
        setShowChangePlanModal(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      synthToast.error("Plan Change Failed", "Failed to update your plan. Please try again.");
    } finally {
      setChangePlanLoading(false);
    }
  };

  const handlePurchaseAddon = (addonId: string) => {
    const addon = addons.find((a) => a.id === addonId);
    if (addon) {
      synthToast.success("Add-on Purchased", `${addon.name} has been added to your plan.`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Active" },
      trialing: { color: "bg-primary/20 text-primary border-primary/30", label: "Trial" },
      past_due: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Past Due" },
      canceling: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Canceling" },
      canceled: { color: "bg-muted text-muted-foreground border-border", label: "Canceled" },
    };
    const variant = variants[status] || variants.canceled;
    return (
      <Badge variant="outline" className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  // Calculate checkout totals for the sticky footer
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const planTotal = selectedPlanData ? getPrice(selectedPlanData) : 0;
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const addon = addons.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  // Loading skeleton for plans
  const PlanSkeleton = () => (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-center mb-6">
        <Skeleton className="h-6 w-24 mx-auto mb-2" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
      <div className="text-center mb-6">
        <Skeleton className="h-10 w-28 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      <div className="space-y-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );

  // Loading skeleton for addons
  const AddonSkeleton = () => (
    <div className="p-5 rounded-xl border border-border">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4 mt-1" />
    </div>
  );

  // Plan Selection Component (reusable)
  const PlanSelectionUI = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className={`text-center ${compact ? "mb-4" : "mb-6"}`}>
        {!compact && <h2 className="font-accent text-2xl text-foreground mb-4">Choose Your Plan</h2>}
        <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-secondary/50 border border-border">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingInterval === "monthly"
                ? "bg-primary text-primary-foreground shadow-button"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingInterval === "yearly"
                ? "bg-primary text-primary-foreground shadow-button"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-3 gap-4" : "md:grid-cols-3 gap-6"}`}>
        {pricesLoading ? (
          <>
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </>
        ) : (
          plans.map((plan) => {
            const isCurrentPlan = subscription.planId === plan.id;
            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                onClick={() => !isCurrentPlan && handlePlanSelect(plan.id)}
                className={`relative rounded-2xl border ${compact ? "p-4" : "p-6"} transition-all ${
                  isCurrentPlan
                    ? "border-emerald-500/50 bg-emerald-500/5 cursor-default"
                    : selectedPlan === plan.id
                    ? "border-primary ring-2 ring-primary/30 bg-gradient-to-b from-primary/10 to-transparent cursor-pointer"
                    : plan.popular
                    ? "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent hover:border-primary cursor-pointer"
                    : "border-border bg-card hover:border-primary/50 cursor-pointer"
                }`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border-0">
                    CURRENT PLAN
                  </Badge>
                )}
                {selectedPlan === plan.id && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    SELECTED
                  </Badge>
                )}
                {plan.popular && selectedPlan !== plan.id && !isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-white border-0">
                    MOST POPULAR
                  </Badge>
                )}
                <div className={`text-center ${compact ? "mb-4" : "mb-6"}`}>
                  <h3 className="font-accent text-xl text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className={`text-center ${compact ? "mb-4" : "mb-6"}`}>
                  {billingInterval === "yearly" ? (
                    <>
                      <span className="text-sm text-muted-foreground line-through">
                        ${plan.monthlyPrice}/mo
                      </span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          ${getMonthlyEquivalent(plan)}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        (billed yearly)
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        ${plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
                {!compact && (
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className={`w-full ${
                    isCurrentPlan
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-default"
                      : selectedPlan === plan.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current" : selectedPlan === plan.id ? "Selected" : "Select"}
                </Button>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 lg:px-6 py-8 pb-32">
      {/* Header */}
      <PageItem className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3 synth-header">
          Billing Settings
        </h1>
        <p className="text-muted-foreground text-lg font-light">
          Manage your subscription, billing, and add-ons
        </p>
      </PageItem>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300">{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-emerald-400 hover:text-emerald-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-red-300">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-destructive hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {pricesError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-red-300">{pricesError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Summary Card */}
      <PageItem className="mb-6">
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Subscription Summary
                  </CardTitle>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    <p className="text-xl font-semibold text-foreground">{subscription.planName}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
                    <p className="text-xl font-semibold text-foreground capitalize">{subscription.billingInterval}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Renewal Date
                    </p>
                    <p className="text-lg font-semibold text-foreground">{formatDate(subscription.renewalDate)}</p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Usage Limits */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Usage This Period
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Workflows</span>
                        <span className="text-foreground font-medium">
                          {subscription.usageLimits.workflowsUsed} / {subscription.usageLimits.workflowsLimit}
                        </span>
                      </div>
                      <Progress 
                        value={(subscription.usageLimits.workflowsUsed / subscription.usageLimits.workflowsLimit) * 100} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Executions</span>
                        <span className="text-foreground font-medium">
                          {subscription.usageLimits.executionsUsed.toLocaleString()} / {subscription.usageLimits.executionsLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={(subscription.usageLimits.executionsUsed / subscription.usageLimits.executionsLimit) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                {subscription.trialEndDate && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-primary">
                        Trial ends: {formatDate(subscription.trialEndDate)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageItem>

          {/* Plan Management */}
          <PageItem className="mb-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    Manage Plan
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    {isSubscribed ? (
                      <>
                        <p className="text-foreground">
                          You're currently on the <span className="font-semibold text-primary">{subscription.planName}</span> plan
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Upgrade or downgrade your plan anytime
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-foreground">
                          You don't have an active subscription
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Subscribe to activate workflows and automations
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {isSubscribed ? (
                      <>
                        <Button variant="outline" onClick={() => setShowChangePlanModal(true)} className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Change Plan
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelModal(true)}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          Cancel Subscription
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowStartSubscriptionModal(true)}
                        className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Start Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageItem>

          {/* Payment Method */}
          <PageItem className="mb-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded bg-background flex items-center justify-center border border-border">
                      <CreditCard className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleOpenPaymentModal}>
                    Update
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Payments are securely processed by Stripe</span>
                </div>
              </CardContent>
            </Card>
          </PageItem>

          {/* Add-ons Management */}
          <PageItem className="mb-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Owned Add-ons */}
                {subscription.ownedAddons.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Purchased</h4>
                    {subscription.ownedAddons.map((addonId) => {
                      const addon = addons.find((a) => a.id === addonId);
                      return addon ? (
                        <div
                          key={addonId}
                          className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/30"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <div>
                              <p className="font-medium text-foreground">{addon.name}</p>
                              <p className="text-sm text-muted-foreground">{addon.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Owned
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Available Add-ons */}
                {pricesLoading ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Available</h4>
                    <AddonSkeleton />
                    <AddonSkeleton />
                  </div>
                ) : (
                  addons.filter((addon) => !subscription.ownedAddons.includes(addon.id)).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Available</h4>
                      {addons
                        .filter((addon) => !subscription.ownedAddons.includes(addon.id))
                        .map((addon) => (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{addon.name}</p>
                              <p className="text-sm text-muted-foreground">{addon.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-bold text-foreground">${addon.price}</span>
                              <Button size="sm" onClick={() => handlePurchaseAddon(addon.id)}>
                                Purchase
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </PageItem>

          {/* Billing History */}
          <PageItem className="mb-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="invoices" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="purchases">Purchase Log</TabsTrigger>
                  </TabsList>
                  <TabsContent value="invoices">
                    {mockInvoices.length > 0 ? (
                      <div className="space-y-3">
                        {mockInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium text-foreground">{invoice.id}</p>
                                <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-foreground">${invoice.amount}</span>
                              <Badge
                                variant="outline"
                                className={
                                  invoice.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                }
                              >
                                {invoice.status}
                              </Badge>
                              <Button size="icon" variant="ghost">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No invoices yet</p>
                    )}
                  </TabsContent>
                  <TabsContent value="purchases">
                    {mockPurchaseLog.length > 0 ? (
                      <div className="space-y-3">
                        {mockPurchaseLog.map((purchase, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                          >
                            <div>
                              <p className="font-medium text-foreground">{purchase.addon}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(purchase.date)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-medium text-foreground">${purchase.amount}</span>
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              >
                                {purchase.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No purchases yet</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </PageItem>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your subscription will remain active until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">
                To confirm cancellation, please type <strong>UNSUBSCRIBE</strong> below:
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmation</Label>
              <Input
                id="confirmation"
                value={cancelConfirmation}
                onChange={(e) => setCancelConfirmation(e.target.value)}
                placeholder="Type UNSUBSCRIBE to confirm"
                className={
                  cancelConfirmation && !isCancelConfirmValid
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you're leaving..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelConfirmation("");
                setCancelReason("");
              }}
            >
              Keep Subscription
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={!isCancelConfirmValid || loading}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Modal */}
      <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>
              Select a new plan. Changes will take effect at the start of your next billing cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PlanSelectionUI compact />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanModal(false)} disabled={changePlanLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPlanChange}
              disabled={!selectedPlan || selectedPlan === subscription.planId || changePlanLoading}
              className="btn-synth"
            >
              {changePlanLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Subscription Modal */}
      <Dialog open={showStartSubscriptionModal} onOpenChange={(open) => {
        setShowStartSubscriptionModal(open);
        if (open && !isSubscribed) {
          setSelectedPlan(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Subscription</DialogTitle>
            <DialogDescription>
              Select a plan to get started with Synth.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PlanSelectionUI compact />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartSubscriptionModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSubscription}
              disabled={!selectedPlan || loading}
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 bg-transparent"
              variant="outline"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
          currentCard={{
            brand: subscription.paymentMethod.brand,
            last4: subscription.paymentMethod.last4,
            expiryMonth: subscription.paymentMethod.expiryMonth,
            expiryYear: subscription.paymentMethod.expiryYear,
          }}
        onSuccess={handlePaymentMethodUpdate}
      />
    </PageTransition>
  );
}
