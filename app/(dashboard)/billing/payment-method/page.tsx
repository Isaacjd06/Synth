"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  CreditCard,
  Shield,
  ArrowLeft,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Initialize Stripe - will be set in component
let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    if (key) {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
};

interface PaymentMethodData {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  cardholder_name?: string;
}

export default function PaymentMethodPage() {
  const router = useRouter();
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current payment method on mount
  useEffect(() => {
    fetchPaymentMethod();
  }, []);

  const fetchPaymentMethod = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/billing/payment-method");
      const data = await response.json();

      if (response.ok && data.hasPaymentMethod) {
        setHasPaymentMethod(true);
        setPaymentMethod({
          brand: data.brand,
          last4: data.last4,
          exp_month: data.exp_month,
          exp_year: data.exp_year,
          cardholder_name: data.cardholder_name,
        });
      } else {
        setHasPaymentMethod(false);
        setPaymentMethod(null);
      }
    } catch (err) {
      console.error("Error fetching payment method:", err);
      setError("Failed to load payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupIntent = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/billing/payment-method/setup-intent", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create setup intent");
      }

      setClientSecret(data.clientSecret);
      toast.success("Payment form initialized");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment form";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Payment form component that uses Stripe Elements
  const PaymentForm = ({ 
    clientSecret: secret,
    onSuccess,
    onError 
  }: { 
    clientSecret: string;
    onSuccess: () => void;
    onError: (message: string) => void;
  }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setIsProcessing(true);
      setIsSaving(true);
      onError("");

      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          onError(submitError.message || "Failed to submit payment form");
          setIsProcessing(false);
          setIsSaving(false);
          return;
        }

        const { error: confirmError, setupIntent } = await stripe.confirmSetup({
          elements,
          clientSecret: secret,
          confirmParams: {
            return_url: `${window.location.origin}/app/billing/payment-method?success=true`,
          },
          redirect: "if_required",
        });

        if (confirmError) {
          onError(confirmError.message || "Failed to confirm payment method");
          setIsProcessing(false);
          setIsSaving(false);
          return;
        }

        if (setupIntent && setupIntent.payment_method) {
          // Update payment method in backend
          const response = await fetch("/api/billing/payment-method", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_method_id: setupIntent.payment_method as string }),
          });

          if (response.ok) {
            toast.success("Payment method saved successfully");
            await fetchPaymentMethod();
            setClientSecret(null);
            onSuccess();
          } else {
            const data = await response.json();
            onError(data.message || "Failed to save payment method");
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save payment method";
        onError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
        setIsSaving(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <Button
          type="submit"
          className="w-full gap-2 btn-synth"
          disabled={!stripe || isProcessing || isSaving}
        >
          {isProcessing || isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Save Payment Method
            </>
          )}
        </Button>
      </form>
    );
  };

  const handleRemovePaymentMethod = async () => {
    try {
      setIsRemoving(true);
      setError(null);

      const response = await fetch("/api/billing/payment-method", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove payment method");
      }

      toast.success("Payment method removed successfully");
      setHasPaymentMethod(false);
      setPaymentMethod(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove payment method";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // Return brand name or icon - Stripe provides brand names like "visa", "mastercard", etc.
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <AppShell>
      <PageTransition className="px-4 lg:px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <PageItem className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2 synth-header">
                Payment Method Settings
              </h1>
              <p className="text-muted-foreground font-light">
                Manage your payment method for Synth subscriptions
              </p>
            </div>
          </div>
        </PageItem>

        {/* Success/Error Messages */}
        {success && (
          <PageItem className="mb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </PageItem>
        )}
        {error && (
          <PageItem className="mb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-destructive/20 border border-destructive/30 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-red-300">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </PageItem>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8 lg:gap-12">
          {/* LEFT COLUMN - Subscription System Explanation */}
          <PageItem>
            <Card className="border-border/50 bg-card h-fit sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  How Billing Works in Synth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Synth uses a flexible subscription system designed around your workflow needs:
                </p>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Add a payment method once
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        After your payment method is saved, you can switch between plans at any time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Plan switches only take effect on the next billing cycle
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        When you switch plans, your current access remains the same until your next payment processes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        You can only change plans once every 14 days
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        This prevents rapid switching and ensures billing cycles stay predictable.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        If your next payment fails, your subscription is paused
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        You will lose access to your paid plan until payment is successful again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Your current plan and your next scheduled plan will always be shown in your Billing Dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </PageItem>

          {/* RIGHT COLUMN - Payment Method Form */}
          <PageItem>
            <Card className="border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Add or Update Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Payment Method Display */}
                {isLoading ? (
                  <div className="p-6 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                ) : hasPaymentMethod && paymentMethod ? (
                  <div className="p-5 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {getCardBrandIcon(paymentMethod.brand)} •••• {paymentMethod.last4}
                          </p>
                          <p className="text-sm text-muted-foreground font-light">
                            Expires {String(paymentMethod.exp_month).padStart(2, "0")}/{paymentMethod.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Active
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isRemoving}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this payment method?
                                You'll need to add a new one to continue your subscription.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleRemovePaymentMethod}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isRemoving}
                              >
                                {isRemoving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30 text-center">
                    <p className="text-muted-foreground text-sm">
                      No payment method on file.
                    </p>
                  </div>
                )}

                {/* Stripe Payment Element Container */}
                <div className="space-y-4">
                  {!clientSecret ? (
                    <div className="min-h-[200px] p-6 rounded-lg bg-muted/20 border border-dashed border-border/60 flex flex-col items-center justify-center space-y-3 text-center">
                      <CreditCard className="w-10 h-10 text-muted-foreground/50" />
                      <div>
                        <p className="text-sm text-muted-foreground/70 mb-1">
                          Your secure payment form will appear here
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                          Click "Initialize Payment Form" to begin
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg bg-muted/20 border border-border/60">
                      <Elements
                        stripe={getStripePromise()}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "night",
                            variables: {
                              colorPrimary: "hsl(217, 91%, 60%)",
                              colorBackground: "hsl(222, 42%, 6%)",
                              colorText: "hsl(210, 20%, 98%)",
                              colorDanger: "hsl(0, 84%, 60%)",
                              fontFamily: "Inter, system-ui, sans-serif",
                              spacingUnit: "4px",
                              borderRadius: "8px",
                            },
                          },
                        } as StripeElementsOptions}
                      >
                        <PaymentForm 
                          clientSecret={clientSecret}
                          onSuccess={() => setSuccess("Payment method saved successfully!")}
                          onError={(msg) => setError(msg)}
                        />
                      </Elements>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
                    <span>
                      Your payment information is encrypted and securely processed by Stripe. 
                      We never store your card details.
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!clientSecret && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={handleSetupIntent}
                      className="flex-1 gap-2 btn-synth"
                      disabled={isSaving || isLoading}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Initialize Payment Form
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/app/billing")}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Billing
                    </Button>
                  </div>
                )}
                {clientSecret && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setClientSecret(null);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="w-full gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageItem>
        </div>
      </PageTransition>
    </AppShell>
  );
}

