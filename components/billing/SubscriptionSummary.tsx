"use client";

interface SubscriptionSummaryProps {
  selectedPlan: {
    name: string;
    price: string;
  } | null;
  selectedAddOns: Array<{
    name: string;
    price: string;
  }>;
  totalPrice: string;
}

export default function SubscriptionSummary({
  selectedPlan,
  selectedAddOns,
  totalPrice,
}: SubscriptionSummaryProps) {
  if (!selectedPlan) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-4 bg-gray-900/50">
      <h3 className="text-lg font-semibold text-white">Summary</h3>

      <div className="space-y-3">
        {/* Plan */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">{selectedPlan.name}</span>
          <span className="text-white font-medium">{selectedPlan.price}/mo</span>
        </div>

        {/* Add-ons */}
        {selectedAddOns.length > 0 && (
          <>
            <div className="border-t border-border pt-3">
              <p className="text-sm text-gray-400 mb-2">Add-ons:</p>
              {selectedAddOns.map((addOn, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">{addOn.name}</span>
                  <span className="text-white font-medium">{addOn.price}/mo</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Total */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-2xl font-bold text-white">{totalPrice}/mo</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 pt-2">
        <p>Billed monthly. Cancel anytime.</p>
      </div>
    </div>
  );
}
