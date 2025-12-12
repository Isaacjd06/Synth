"use client";

import { useState } from "react";
import { CreditCard, Lock, Shield, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { synthToast } from "@/lib/synth-toast";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  currentCard?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
  onSuccess?: (card: { brand: string; last4: string; expiryMonth: number; expiryYear: number }) => void;
}

const PaymentMethodModal = ({ open, onClose, currentCard, onSuccess }: PaymentMethodModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePaymentMethod = async () => {
    setIsLoading(true);
    
    // Simulate Stripe payment method save
    // In production, this would:
    // 1. Call stripe.confirmSetup() with the PaymentElement
    // 2. Send the payment method to your backend
    // 3. Update the user's payment method in Stripe
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful update
      const newCard = {
        brand: "Visa",
        last4: "4242",
        expiryMonth: 12,
        expiryYear: 2027,
      };
      
      onSuccess?.(newCard);
      synthToast.success("Payment Method Updated", "Your payment method has been updated successfully.");
      onClose();
    } catch (error) {
      synthToast.error("Update Failed", "Failed to update payment method. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            {currentCard ? "Update Payment Method" : "Add Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {currentCard 
              ? "Update your payment method to keep your subscription active."
              : "Add a payment method to start your subscription."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Current Card Display */}
          {currentCard && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {currentCard.brand} •••• {currentCard.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {currentCard.expiryMonth}/{currentCard.expiryYear}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stripe Elements Placeholder */}
          <div 
            id="stripe-payment-element-modal"
            className="min-h-[180px] p-6 rounded-xl bg-muted/20 border border-dashed border-border/60 flex items-center justify-center"
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground/70">
                  Secure payment form will appear here
                </p>
                <p className="text-xs text-muted-foreground/50">
                  Powered by Stripe
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your payment information is encrypted and securely processed by Stripe. We never store your full card details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSavePaymentMethod}
              className="w-full gap-2 btn-synth"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {currentCard ? "Update Payment Method" : "Save Payment Method"}
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;

