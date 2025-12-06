"use client";

import { Check } from "lucide-react";

interface AddOn {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: string;
}

interface AddonSelectorProps {
  addOns: AddOn[];
  selectedAddOns: string[];
  onToggleAddOn: (priceId: string) => void;
  disabled?: boolean;
}

export default function AddonSelector({
  addOns,
  selectedAddOns,
  onToggleAddOn,
  disabled = false,
}: AddonSelectorProps) {
  if (addOns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Add-ons (Optional)</h3>
      <div className="space-y-3">
        {addOns.map((addOn) => {
          const isSelected = selectedAddOns.includes(addOn.priceId);

          return (
            <div
              key={addOn.id}
              className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-900/10"
                  : "border-border hover:border-blue-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onToggleAddOn(addOn.priceId)}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-600 bg-gray-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Add-on details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">{addOn.name}</h4>
                  <span className="text-white font-semibold">
                    {addOn.price}
                    <span className="text-sm text-gray-400 font-normal">/mo</span>
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{addOn.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
