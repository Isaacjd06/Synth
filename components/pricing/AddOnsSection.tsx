"use client";

import { motion } from "framer-motion";
import { Zap, Rocket, Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const capacityPacks = [
  { runs: "25k", price: 49 },
  { runs: "75k", price: 99 },
  { runs: "200k", price: 199 },
];

export default function AddOnsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-accent text-3xl md:text-4xl font-bold text-foreground mb-4">
            Power Up Synth with Add-Ons
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Extend your capabilities with flexible add-ons that scale with your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Capacity Packs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 bg-background/50 border border-border/30 hover:border-border/60 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-accent text-xl font-bold text-foreground mb-2">
              Automation Capacity Packs
            </h3>
            <p className="text-sm text-foreground/60 mb-6">
              Extra monthly automation capacity beyond standard plan usage.
            </p>
            
            <div className="space-y-3 mb-6">
              {capacityPacks.map((pack) => (
                <div
                  key={pack.runs}
                  className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 border border-border/20"
                >
                  <span className="text-sm text-foreground/80">
                    <Plus className="w-3 h-3 inline mr-1" />
                    {pack.runs} Runs
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    ${pack.price}/mo
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-foreground/50 italic">
              "When you approach your monthly automation limit, Synth notifies you. Add a Capacity Pack so your workflows never stop running."
            </p>
          </motion.div>

          {/* Priority Execution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-6 bg-background/50 border border-border/30 hover:border-border/60 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-accent text-xl font-bold text-foreground mb-2">
              Priority Execution & Support
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
              Get ahead of the queue with faster execution and priority support.
            </p>
            
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-6">
              <span className="text-2xl font-bold text-foreground">$99</span>
              <span className="text-foreground/60">/mo</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {[
                "Faster execution lane when supported",
                "Priority support response",
                "Debugging priority",
                "Optional Slack/Discord support later",
              ].map((item, i) => (
                <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                  <span className="text-accent">•</span>
                  {item}
                </li>
              ))}
            </ul>
            
            <p className="text-xs text-foreground/50 italic">
              Ideal for: Lead routing, agencies, time-sensitive workflows.
            </p>
          </motion.div>

          {/* Done-For-You */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-6 bg-gradient-to-b from-primary/10 to-background border-2 border-primary/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-accent text-xl font-bold text-foreground mb-2">
              Done-For-You Setup + Optimization
            </h3>
            <p className="text-sm text-foreground/60 mb-6">
              Let our experts build and optimize your automations.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-foreground/5 border border-border/20">
                <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">One-Time Setup</p>
                <p className="text-xl font-bold text-foreground">$500–$1,500</p>
                <ul className="mt-3 space-y-1 text-xs text-foreground/60">
                  <li>• Business intake process</li>
                  <li>• Workflow architecture design</li>
                  <li>• Full build + QA + walkthrough</li>
                  <li>• Automation roadmap</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-foreground/5 border border-border/20">
                <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">Ongoing Optimization</p>
                <p className="text-xl font-bold text-foreground">$249–$499/mo</p>
                <ul className="mt-3 space-y-1 text-xs text-foreground/60">
                  <li>• 1 workflow optimization cycle/mo</li>
                  <li>• Priority debugging</li>
                  <li>• Quarterly automation review</li>
                </ul>
              </div>
            </div>
            
            <p className="text-xs text-accent italic text-center">
              "Synth becomes your automation engineer."
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

