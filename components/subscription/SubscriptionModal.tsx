"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"
import { Sparkles, Check, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/month",
    features: [
      "5 active automations",
      "1,000 executions/month",
      "Email support",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    period: "/month",
    popular: true,
    features: [
      "Unlimited automations",
      "10,000 executions/month",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
];

const SubscriptionModal = ({ open, onClose, feature }: SubscriptionModalProps) => {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    onClose();
    router.push("/app/billing", { state: { selectedPlan: planId } });
  };

  const handleViewPlans = () => {
    onClose();
    router.push("/app/billing");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-border/60 bg-card/95 backdrop-blur-xl overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <DialogHeader className="relative">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
          >
            <Sparkles className="w-7 h-7 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
          </motion.div>
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
            Subscription Required
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground font-light mt-2">
            {feature
              ? `Subscribe to ${feature}`
              : "Subscribe to unlock Synth's automation engine."}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-200 cursor-pointer hover:border-primary/40 ${
                plan.popular
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/50 bg-muted/20"
              }`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                  Popular
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-3">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            onClick={handleViewPlans}
            className="w-full bg-primary hover:bg-primary/90 gap-2"
          >
            Subscribe Now
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;





