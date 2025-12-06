"use client";

import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface PaymentElementFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

export default function PaymentElementForm({
  onSuccess,
  onError,
  submitButtonText = "Save Payment Method",
  isLoading = false,
}: PaymentElementFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
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
        setErrorMessage(error.message || "An error occurred");
        onError(error.message || "An error occurred");
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
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      onError(err.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {processing || isLoading ? "Processing..." : submitButtonText}
      </button>
    </form>
  );
}
