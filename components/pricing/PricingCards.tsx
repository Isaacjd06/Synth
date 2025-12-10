"use client";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardsProps {
  isYearly: boolean;
}

const plans = [
  {
    name: "Starter",
    monthlyPrice: 49,
    tagline: "Perfect for simple, high-impact automations.",
    idealFor: "Solo founders, creators, small operators.",
    features: [
      "3 Active Workflows",
      "Soft cap: ~5k–10k runs/month",
      "Core automation builder",
      "Email support",
      "Connect basic apps (Gmail, Notion, Airtable, Sheets, Slack, CRM basics)",
      "Error alerts & basic debugging",
      "Workflow versioning",
      "7-day data retention",
      "Secure credential isolation",
    ],
    cta: "Start 3-Day Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    monthlyPrice: 149,
    tagline: "Your business runs on automation — Synth makes it run reliably.",
    idealFor: "Agencies, closers & setters, online businesses relying on automation daily.",
    features: [
      "Everything in Starter, plus:",
      "10 Active Workflows",
      "Soft cap: ~25k–35k runs/month",
      "Priority email support",
      "AI workflow optimization suggestions",
      "Multi-step workflow templates",
      "Advanced routing & conditional logic",
      "Sales & operations tool integrations",
      "30-day data retention",
      "Automatic retries & smarter error handling",
      "Template library access",
      "AI-generated workflow documentation",
    ],
    cta: "Choose Growth",
    popular: true,
  },
  {
    name: "Scale",
    monthlyPrice: 399,
    tagline: "Scale operations without scaling headcount.",
    idealFor: "Larger teams, heavy automation users, businesses using Synth as infrastructure.",
    features: [
      "Everything in Growth, plus:",
      "30–40 Active Workflows",
      "Soft cap: ~75k–100k runs/month",
      "VIP support",
      "Priority execution lane",
      "Early access to new integrations",
      "90-day data retention",
      "Workflow architecture assistance",
      "SLA for mission-critical workflows",
    ],
    cta: "Scale With Synth",
    popular: false,
  },
];

const PricingCards = ({ isYearly }: PricingCardsProps) => {
  const getPrice = (monthlyPrice: number) => {
    if (isYearly) {
      return Math.round(monthlyPrice * 0.8);
    }
    return monthlyPrice;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto px-6">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.name}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -8 }}
          className={`relative rounded-2xl p-8 transition-all duration-300 ${
            plan.popular
              ? "bg-gradient-to-b from-primary/10 to-background border-2 border-primary/50 shadow-2xl shadow-primary/10 scale-[1.02] z-10"
              : "bg-background/50 border border-border/30 hover:border-border/60"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Most Popular
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-accent text-2xl font-bold text-foreground mb-2">
              {plan.name}
            </h3>
            <p className="text-sm text-foreground/50">{plan.idealFor}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                ${getPrice(plan.monthlyPrice)}
              </span>
              <span className="text-foreground/50">/mo</span>
            </div>
            {isYearly && (
              <p className="text-xs text-accent mt-1">
                Billed annually (${getPrice(plan.monthlyPrice) * 12}/year)
              </p>
            )}
          </div>

          <p className="text-sm text-foreground/60 mb-6 italic">
            "{plan.tagline}"
          </p>

          <Button
            className={`w-full mb-8 rounded-xl py-6 font-accent ${
              plan.popular
                ? "bg-primary hover:bg-primary/90"
                : "bg-foreground/10 hover:bg-foreground/20 text-foreground"
            }`}
          >
            {plan.cta}
          </Button>

          <ul className="space-y-3">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  feature.startsWith("Everything") ? "text-accent" : "text-primary"
                }`} />
                <span className={`${
                  feature.startsWith("Everything") 
                    ? "text-accent font-medium" 
                    : "text-foreground/70"
                }`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
};

export default PricingCards;




