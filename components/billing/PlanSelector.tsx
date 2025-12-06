"use client";

import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface Plan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: string;
  features: string[];
  popular?: boolean;
}

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlan: string | null;
  onSelectPlan: (priceId: string) => void;
  disabled?: boolean;
}

export default function PlanSelector({
  plans,
  selectedPlan,
  onSelectPlan,
  disabled = false,
}: PlanSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Select a Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.priceId;

          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-border hover:border-blue-400"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !disabled && onSelectPlan(plan.priceId)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  {plan.popular && <Badge variant="active">Popular</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-white">
                  {plan.price}
                  <span className="text-sm text-gray-400 font-normal">/month</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="text-sm font-medium text-blue-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Selected
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
