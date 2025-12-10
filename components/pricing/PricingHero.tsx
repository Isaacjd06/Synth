"use client";
import { motion } from "framer-motion";
import { Shield, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PricingHero = () => {
  const trustIndicators = [
    { icon: Shield, text: "Enterprise-grade automation engine" },
    { icon: DollarSign, text: "Predictable, fair usage pricing" },
    { icon: X, text: "Cancel anytime" },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-accent text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            <span className="text-foreground">Automation That </span>
            <span className="bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-clip-text text-transparent">
              Thinks
            </span>
            <span className="text-foreground"> — Plans — and </span>
            <span className="bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-clip-text text-transparent">
              Runs Your Business.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-lg md:text-xl text-foreground/60 mb-10 max-w-2xl mx-auto"
          >
            Pick the plan that matches your workflow needs. Add capacity only when you grow. No hidden usage fees. No surprise bills.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button
              size="lg"
              className="group relative px-8 py-6 text-base font-accent rounded-xl overflow-hidden"
              style={{
                boxShadow: "0 0 25px hsl(217 100% 60% / 0.25), 0 4px 16px -4px hsl(217 100% 50% / 0.3)",
              }}
            >
              <span className="relative z-10">Start 3-Day Free Trial</span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-[length:200%_100%]"
                animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base font-accent rounded-xl border-border/50 hover:border-primary/50 hover:bg-primary/5"
            >
              Book Demo / Done-For-You Setup
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
          >
            {trustIndicators.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-foreground/40"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;




