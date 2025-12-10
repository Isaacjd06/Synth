"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Plan and addon data
const plansData: Record<string, { name: string; monthlyPrice: number; yearlyPrice: number }> = {
  starter: { name: "Starter", monthlyPrice: 49, yearlyPrice: 470 },
  pro: { name: "Pro", monthlyPrice: 149, yearlyPrice: 1430 },
  agency: { name: "Agency", monthlyPrice: 399, yearlyPrice: 3830 },
};

const addonsData: Record<string, { name: string; price: number }> = {
  rapid_booster: { name: "Rapid Automation Booster", price: 49 },
  performance_turbo: { name: "Workflow Performance Turbo", price: 99 },
  business_jumpstart: { name: "Business Systems Jumpstart", price: 500 },
  persona_training: { name: "AI Persona Training", price: 249 },
  unlimited_knowledge: { name: "Unlimited Knowledge Injection", price: 79 },
};

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Payment Form Component
function PaymentForm({
  planId,
  selectedAddons,
  billingInterval,
  billingDetails,
  setBillingDetails,
  handleInputChange,
  onSuccess,
}: {
  planId: string;
  selectedAddons: string[];
  billingInterval: "monthly" | "yearly";
  billingDetails: any;
  setBillingDetails: any;
  handleInputChange: (field: string, value: string) => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm the SetupIntent to get the payment method
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check your payment details.");
        setLoading(false);
        return;
      }

      // Get the payment method from the SetupIntent
      const { setupIntent, error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?success=true`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Failed to confirm payment method.");
        setLoading(false);
        return;
      }

      if (!setupIntent?.payment_method) {
        setError("Failed to retrieve payment method.");
        setLoading(false);
        return;
      }

      // Call the checkout process API
      const response = await fetch("/api/checkout/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planId,
          addons: selectedAddons,
          paymentMethodId: setupIntent.payment_method as string,
          billingDetails: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
            address: billingDetails.address,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment processing failed.");
      }

      toast.success("Payment processed successfully!");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="space-y-2">
        <Label>Card Information</Label>
        <div className="p-4 rounded-lg border border-border bg-background">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>
      </div>

      {/* Billing Details */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Billing Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={billingDetails.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={billingDetails.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={billingDetails.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address1">Address Line 1 *</Label>
          <Input
            id="address1"
            value={billingDetails.address.line1}
            onChange={(e) => handleInputChange("address.line1", e.target.value)}
            placeholder="123 Main St"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address2">Address Line 2</Label>
          <Input
            id="address2"
            value={billingDetails.address.line2}
            onChange={(e) => handleInputChange("address.line2", e.target.value)}
            placeholder="Apt 4B"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={billingDetails.address.city}
              onChange={(e) => handleInputChange("address.city", e.target.value)}
              placeholder="New York"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={billingDetails.address.state}
              onChange={(e) => handleInputChange("address.state", e.target.value)}
              placeholder="NY"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal">Postal Code *</Label>
            <Input
              id="postal"
              value={billingDetails.address.postal_code}
              onChange={(e) => handleInputChange("address.postal_code", e.target.value)}
              placeholder="10001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select
              value={billingDetails.address.country}
              onValueChange={(value) => handleInputChange("address.country", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full btn-system bg-primary text-primary-foreground h-12 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete Purchase
          </>
        )}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planId = searchParams.get("plan") || "";
  const addonsParam = searchParams.get("addons") || "";
  const billingInterval = (searchParams.get("interval") as "monthly" | "yearly") || "monthly";
  const selectedAddons = addonsParam ? addonsParam.split(",").filter(Boolean) : [];
  const success = searchParams.get("success");
  
  // Check if Stripe publishable key is configured
  const hasStripeKey = !!stripePublishableKey;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
    },
  });

  // Load SetupIntent on mount
  useEffect(() => {
    const loadSetupIntent = async () => {
      try {
        const response = await fetch("/api/checkout/setup-intent", {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle authentication errors specifically
          if (response.status === 401) {
            const errorMessage = data.error || "Please sign in to continue with checkout";
            toast.error(errorMessage);
            // Redirect to sign in after a short delay
            setTimeout(() => {
              router.push("/api/auth/signin");
            }, 2000);
            throw new Error(errorMessage);
          }
          const errorMessage = data.error || "Failed to initialize payment form";
          throw new Error(errorMessage);
        }

        if (!data.client_secret) {
          throw new Error("Invalid response from server: missing client_secret");
        }

        setClientSecret(data.client_secret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load payment form";
        setError(errorMessage);
        console.error("SetupIntent loading error:", err);
        toast.error(errorMessage);
      } finally {
        setLoadingSetup(false);
      }
    };

    loadSetupIntent();
  }, []);

  // Handle success redirect
  useEffect(() => {
    if (success === "true") {
      // Payment was successful, redirect to dashboard
      router.push("/dashboard?payment=success");
    }
  }, [success, router]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.replace("address.", "");
      setBillingDetails((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setBillingDetails((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSuccess = () => {
    router.push("/dashboard?payment=success");
  };

  // Calculate totals
  const plan = plansData[planId];
  const planPrice = plan ? (billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice) : 0;
  const addonsTotal = selectedAddons.reduce((sum, id) => sum + (addonsData[id]?.price || 0), 0);
  const total = planPrice + addonsTotal;

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Plan Selected</h2>
          <p className="text-muted-foreground mb-4">Please select a plan first.</p>
          <Button onClick={() => router.push("/billing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#1e40af",
        colorBackground: "#0a0a0a",
        colorText: "#ffffff",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-foreground">Checkout</h1>
          <Button variant="ghost" onClick={() => router.push("/billing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-destructive/20 to-destructive/10 border border-destructive/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <span className="text-red-300 flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-destructive hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="font-accent text-xl text-foreground mb-6">Order Summary</h2>

              {/* Selected Plan */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                      Plan
                    </Badge>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Billed {billingInterval}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">
                      ${planPrice}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingInterval === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Add-ons */}
              {selectedAddons.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground">Add-ons</h4>
                  {selectedAddons.map((addonId) => {
                    const addon = addonsData[addonId];
                    if (!addon) return null;
                    return (
                      <div
                        key={addonId}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        <span className="text-foreground">{addon.name}</span>
                        <span className="font-medium text-foreground">${addon.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal (Plan)</span>
                  <span>${planPrice}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Add-ons (one-time)</span>
                    <span>${addonsTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${total} USD</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="order-1 lg:order-2"
          >
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-accent text-xl text-foreground">Payment Information</h2>
              </div>

              {loadingSetup ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !hasStripeKey ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <p className="font-semibold mb-2">Stripe is not configured</p>
                  <p className="text-sm">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing.</p>
                </div>
              ) : clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentForm
                    planId={planId}
                    selectedAddons={selectedAddons}
                    billingInterval={billingInterval}
                    billingDetails={billingDetails}
                    setBillingDetails={setBillingDetails}
                    handleInputChange={handleInputChange}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <p className="font-semibold mb-2">Failed to load payment form</p>
                  <p className="text-sm mb-4">{error || "Please refresh the page or contact support."}</p>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
