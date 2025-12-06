"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, GitMerge, Workflow, Sparkles } from "lucide-react";

const capabilities = [
  { icon: Sparkles, label: "Context Recognition" },
  { icon: GitMerge, label: "Pattern Linking" },
  { icon: Workflow, label: "System Building" },
];

export default function WhatIsSynthSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-16 md:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />

      {/* AI interpretation visualization */}
      <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2">
        {/* Central intelligence glow */}
        <motion.div
          className="absolute inset-[20%] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 55%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Pattern recognition orbits */}
        <motion.div
          className="absolute inset-[10%] rounded-full border border-primary/8"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-primary/35"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          className="absolute inset-[25%] rounded-full border border-primary/5"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -right-1 top-1/2 h-2 w-2 rounded-full bg-primary/25"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* Branching logic indicators */}
        <motion.div
          className="absolute left-[20%] top-[15%] h-2 w-2 rounded-full bg-primary/30"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[25%] h-1.5 w-1.5 rounded-full bg-primary/25"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container relative z-10 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-primary"
          >
            The Intelligence Layer
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 font-display-bold text-4xl tracking-tight md:text-5xl lg:text-6xl"
          >
            What is <span className="text-gradient">Synth</span>?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6 text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            <p>
              Synth is a <span className="font-medium text-foreground">thinking automation engine</span> that
              interprets natural language, <span className="font-medium text-primary">understands workflow patterns</span>,
              and constructs complete automation systems dynamically.
            </p>
            <p>
              It replaces traditional manual configuration. Describe your intent—Synth handles
              context recognition, <span className="font-medium text-primary">builds branching logic</span>,
              links patterns together, and <span className="font-medium text-foreground">adapts based on behavior</span>.
            </p>
          </motion.div>

          {/* Visual capability indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-4"
          >
            {capabilities.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-primary/70" />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
