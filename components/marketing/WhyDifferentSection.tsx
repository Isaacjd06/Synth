"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Brain, Layers, Shield, type LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Brain,
    title: "Truly Intelligent",
    description: "Synth analyzes context, learns from patterns, and adapts its behavior. It doesn't just execute—it reasons and evolves.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Intent in, working automation out. No manual configuration, no learning curve. Describe what you need and it's built.",
  },
  {
    icon: Layers,
    title: "Infinitely Composable",
    description: "Modular blocks that connect in any combination. Build complex systems from simple components that scale together.",
  },
  {
    icon: Shield,
    title: "Enterprise-Ready",
    description: "Bank-grade security with SOC 2 compliance. Granular permissions ensure your automations stay secure at scale.",
  },
];

export default function WhyDifferentSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-16 md:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-transparent" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 grid-computation opacity-20" />

      {/* Floating glow */}
      <motion.div
        className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 55%)",
        }}
        animate={{ x: [-20, 30, -20], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10 px-6">
        <div className="mb-12 text-center md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-primary"
          >
            System Architecture
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display-bold text-4xl tracking-tight md:text-5xl lg:text-6xl"
          >
            Built for the <span className="text-gradient">modern</span> team
          </motion.h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + index * 0.12 }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35 }}
                className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-8 shadow transition-colors hover:border-primary/50"
              >
                <div className="flex items-start gap-5">
                  {/* Icon with neural pulse */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-all group-hover:border-primary/40 group-hover:bg-primary/20"
                  >
                    <feature.icon className="h-6 w-6 text-primary" />
                  </motion.div>

                  <div className="flex-1">
                    <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
