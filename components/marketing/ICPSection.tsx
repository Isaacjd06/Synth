"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Briefcase, Code2, BarChart3, CheckCircle2, type LucideIcon } from "lucide-react";

interface Persona {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
}

const personas: Persona[] = [
  {
    icon: Briefcase,
    title: "Operations Teams",
    subtitle: "Reliability & System Clarity",
    description: "Eliminate manual errors and gain full visibility into processes. Synth builds reliable systems that scale across departments.",
    benefits: ["Error reduction", "Process visibility", "Cross-team sync"],
  },
  {
    icon: Code2,
    title: "Product Builders",
    subtitle: "Zero Cognitive Load",
    description: "Abstract away complexity. Focus on building products while Synth handles the repetitive infrastructure work automatically.",
    benefits: ["No-code automation", "Instant integrations", "Background tasks"],
  },
  {
    icon: BarChart3,
    title: "Growth Leaders",
    subtitle: "Real-Time Execution",
    description: "Automate experiments, nurture leads, and execute workflows in real-time. Let data drive decisions, automatically.",
    benefits: ["Automated follow-ups", "Live insights", "Scaled experiments"],
  },
];

export default function ICPSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-16 md:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-transparent" />

      {/* Data flow lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[30%] top-0 h-full w-px"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.12), transparent)",
          }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-[38%] top-0 h-full w-px"
          style={{
            background: "linear-gradient(180deg, transparent, hsl(var(--primary) / 0.08), transparent)",
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container relative z-10 px-6">
        <div className="mb-12 text-center md:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block text-sm font-medium uppercase tracking-widest text-primary"
          >
            Use Cases
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto max-w-2xl font-display-bold text-4xl tracking-tight md:text-5xl lg:text-6xl"
          >
            Designed for <span className="text-gradient">ambitious</span> teams
          </motion.h2>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 lg:gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + index * 0.15 }}
            >
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4 }}
                className="group relative h-full"
              >
                <div className="relative h-full rounded-xl border border-border bg-card p-8 shadow transition-colors hover:border-primary/50">
                  {/* Icon with subtle animation */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    animate={isInView ? { y: [0, -3, 0] } : {}}
                    transition={{ y: { duration: 4, repeat: Infinity, delay: index * 0.5 } }}
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-all group-hover:border-primary/40 group-hover:bg-primary/20"
                  >
                    <persona.icon className="h-6 w-6 text-primary" />
                  </motion.div>

                  <h3 className="font-display mb-1 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                    {persona.title}
                  </h3>

                  <p className="mb-4 text-sm font-medium text-primary/70">
                    {persona.subtitle}
                  </p>

                  <p className="mb-6 leading-relaxed text-muted-foreground">
                    {persona.description}
                  </p>

                  {/* Benefit indicators */}
                  <div className="space-y-2">
                    {persona.benefits.map((benefit, i) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.5 + index * 0.15 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary/60" />
                        <span>{benefit}</span>
                      </motion.div>
                    ))}
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
