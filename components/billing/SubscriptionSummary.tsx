"use client";

interface SubscriptionSummaryProps {
  selectedPlan: {
    name: string;
    price?: string | number; // Can be formatted string or amount in cents from Stripe
    amount?: number; // Amount in cents from Stripe (preferred)
  } | null;
  selectedAddOns: Array<{
    name: string;
    price?: string | number; // Can be formatted string or amount in cents from Stripe
    amount?: number; // Amount in cents from Stripe (preferred)
  }>;
  subtotal?: string | number; // Subtotal in cents from Stripe
  tax?: string | number; // Tax in cents from Stripe
  totalPrice: string | number; // Total in cents from Stripe
  currency?: string;
}

export default function SubscriptionSummary({
  selectedPlan,
  selectedAddOns,
  subtotal,
  tax,
  totalPrice,
  currency = "usd",
}: SubscriptionSummaryProps) {
  if (!selectedPlan) {
    return null;
  }

  const formatCurrency = (amount: string | number | undefined): string => {
    if (amount === undefined || amount === null) return "$0.00";
    
    if (typeof amount === "string") {
      // If it's already formatted (contains currency symbol), return as is
      if (amount.includes("$") || amount.includes("€") || amount.includes("£")) {
        return amount;
      }
      // Otherwise parse it as a number
      const num = parseFloat(amount);
      if (isNaN(num)) return "$0.00";
      // If the number is large (> 1000), assume it's in cents, otherwise assume it's in dollars
      const value = num > 1000 ? num / 100 : num;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(value);
    }
    // If it's a number, assume it's in cents (Stripe format)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="border border-border rounded-lg p-6 space-y-4 bg-gray-900/50">
      <h3 className="text-lg font-semibold text-white">Summary</h3>

      <div className="space-y-3">
        {/* Plan */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">{selectedPlan.name}</span>
          <span className="text-white font-medium">
            {formatCurrency(selectedPlan.amount || selectedPlan.price)}
          </span>
        </div>

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-gray-400 mb-2">Add-ons:</p>
              {selectedAddOns.map((addOn, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">{addOn.name}</span>
                  <span className="text-white font-medium">
                    {formatCurrency(addOn.amount || addOn.price)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Subtotal */}
        {subtotal && (
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Subtotal</span>
              <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
            </div>
          </div>
        )}

        {/* Tax */}
        {tax && parseFloat(tax.toString()) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Tax</span>
            <span className="text-white font-medium">{formatCurrency(tax)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-2xl font-bold text-white">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 pt-2">
        <p>Billed monthly. Cancel anytime.</p>
        {tax && parseFloat(tax.toString()) > 0 && (
          <p className="mt-1">Tax calculated based on your location</p>
        )}
      </div>
    </div>
  );
}
