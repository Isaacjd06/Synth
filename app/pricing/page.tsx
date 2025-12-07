"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import PricingHero from "@/components/pricing/PricingHero";
import PricingToggle from "@/components/pricing/PricingToggle";
import PricingCards from "@/components/pricing/PricingCards";
import AddOnsSection from "@/components/pricing/AddOnsSection";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import PricingCTA from "@/components/pricing/PricingCTA";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 py-6 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-accent text-lg font-bold text-foreground">Synth</span>
          </motion.div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10">
        <PricingHero />
        <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
        <PricingCards isYearly={isYearly} />
        <AddOnsSection />
        <ComparisonTable />
        <PricingFAQ />
        <PricingCTA />
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-border/20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-foreground/40">
            © 2025 Synth. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

