"use client";

import { motion } from "framer-motion";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}

export default function PricingToggle({ isYearly, onToggle }: PricingToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center mb-12"
    >
      <div className="inline-flex items-center p-1.5 rounded-xl bg-background/50 border border-border/30 backdrop-blur-sm">
        <button
          onClick={() => onToggle(false)}
          className={`relative px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
            !isYearly
              ? "text-primary-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {!isYearly && (
            <motion.div
              layoutId="toggle-bg"
              className="absolute inset-0 bg-primary rounded-lg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Monthly</span>
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`relative px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
            isYearly
              ? "text-primary-foreground"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {isYearly && (
            <motion.div
              layoutId="toggle-bg"
              className="absolute inset-0 bg-primary rounded-lg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            Yearly
            <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </motion.div>
  );
}

