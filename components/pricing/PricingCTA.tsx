"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PricingCTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-accent text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Your business deserves automations that{" "}
            <span className="bg-gradient-to-r from-primary via-synth-blue-light to-primary bg-clip-text text-transparent">
              think for you.
            </span>
          </h2>

          <p className="text-lg text-foreground/60 mb-10">
            Choose a plan — or let us build everything for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button
              size="lg"
              className="group relative px-8 py-6 text-base font-accent rounded-xl overflow-hidden"
              style={{
                boxShadow: "0 0 25px hsl(217 100% 60% / 0.25), 0 4px 16px -4px hsl(217 100% 50% / 0.3)",
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start 3-Day Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
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
              Book Done-For-You Setup Call
            </Button>
          </div>

          {/* Open Dashboard Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10"
          >
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="group px-8 py-6 text-base font-accent rounded-xl hover:bg-secondary/80"
            >
              <Link href="/workflows" className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Open Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20"
          >
            <Shield className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm text-foreground/70">
              14-Day No-Risk Guarantee — full refund if Synth doesn't create meaningful time savings.
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

